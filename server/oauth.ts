import { Request, Response } from "express";
import axios from "axios";
import { storage } from "./storage";
import { randomBytes } from "crypto";
import { AppConnection } from "@shared/schema";

// OAuth configs for different services
export const oauthConfigs = {
  instagram: {
    authorizationURL: "https://api.instagram.com/oauth/authorize",
    tokenURL: "https://api.instagram.com/oauth/access_token",
    clientID: process.env.INSTAGRAM_CLIENT_ID,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    callbackURL: "/api/callback/instagram", // Updated to use consistent path format
    scope: ["user_profile", "user_media"],
    apiBaseURL: "https://graph.instagram.com",
    profile: (accessToken: string) => getInstagramProfile(accessToken),
  },
  linkedin: {
    authorizationURL: "https://www.linkedin.com/oauth/v2/authorization",
    tokenURL: "https://www.linkedin.com/oauth/v2/accessToken",
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: "/api/callback/linkedin", // Updated to use consistent path format
    scope: ["openid", "profile", "email"],
    apiBaseURL: "https://api.linkedin.com/v2",
    profile: (accessToken: string) => getLinkedInProfile(accessToken),
  },
  twitter: {
    authorizationURL: "https://twitter.com/i/oauth2/authorize",
    tokenURL: "https://api.twitter.com/2/oauth2/token",
    clientID: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    callbackURL: "/api/callback/twitter", // Updated to use consistent path format
    scope: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    apiBaseURL: "https://api.twitter.com/2",
    profile: (accessToken: string) => getTwitterProfile(accessToken),
  },
  google: {
    authorizationURL: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenURL: "https://oauth2.googleapis.com/token",
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/callback/google", // Updated to use consistent path format
    scope: ["https://www.googleapis.com/auth/youtube", "https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"],
    apiBaseURL: "https://www.googleapis.com/youtube/v3",
    profile: (accessToken: string) => getGoogleProfile(accessToken),
  },
};

// Validate the OAuth service type
export type OAuthService = keyof typeof oauthConfigs;
export function isValidOAuthService(service: string): service is OAuthService {
  return service in oauthConfigs;
}

// Generate a random state for OAuth security
export function generateState(): string {
  return randomBytes(16).toString("hex");
}

// Store the OAuth state in the session
// Accepts any service string to support additional OAuth services beyond the main ones
export function storeOAuthState(req: Request, service: string, state: string) {
  if (!req.session.oauthStates) {
    req.session.oauthStates = {};
  }
  req.session.oauthStates[service] = state;
}

// Verify the OAuth state from the session
// Accepts any service string to support additional OAuth services beyond the main ones
export function verifyOAuthState(req: Request, service: string, state: string): boolean {
  const storedState = req.session.oauthStates?.[service];
  if (storedState && storedState === state) {
    delete req.session.oauthStates?.[service];
    return true;
  }
  return false;
}

// Store OAuth credentials in the session
// Accepts any service string to support additional OAuth services beyond the main ones
export function storeOAuthCredentials(req: Request, service: string, credentials: any) {
  if (!req.session.oauthCredentials) {
    req.session.oauthCredentials = {};
  }
  req.session.oauthCredentials[service] = credentials;
}

// Get OAuth credentials from session
// Accepts any service string to support additional OAuth services beyond the main ones
export function getOAuthCredentials(req: Request, service: string): any {
  return req.session.oauthCredentials?.[service];
}

// Helper functions to get user profiles from different services
async function getInstagramProfile(accessToken: string) {
  try {
    // First, get the basic profile info from the Instagram Graph API
    const response = await axios.get(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`);
    
    // Then get the user's media (if available)
    try {
      const mediaResponse = await axios.get(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username&access_token=${accessToken}&limit=5`);
      
      // Combine the user profile with media data
      return {
        ...response.data,
        media: mediaResponse.data.data || [],
        accessToken: accessToken // Store the token for future use
      };
    } catch (mediaError) {
      console.warn("Could not fetch Instagram media:", mediaError);
      // Return just the profile if media fetch fails
      return {
        ...response.data,
        accessToken: accessToken // Store the token for future use
      };
    }
  } catch (error) {
    console.error("Failed to get Instagram profile:", error);
    throw error;
  }
}

async function getLinkedInProfile(accessToken: string) {
  try {
    const response = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'cache-control': 'no-cache',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to get LinkedIn profile:", error);
    throw error;
  }
}

async function getTwitterProfile(accessToken: string) {
  try {
    const response = await axios.get('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      params: {
        'user.fields': 'id,name,username,profile_image_url',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to get Twitter profile:", error);
    throw error;
  }
}

async function getGoogleProfile(accessToken: string) {
  try {
    const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to get Google profile:", error);
    throw error;
  }
}

// Save connection to the database
// Accepts any service string to support additional OAuth services beyond the main ones
export async function saveConnection(req: Request, service: string, profile: any, credentials: any) {
  try {
    if (!req.isAuthenticated()) {
      throw new Error("User not authenticated");
    }

    console.log(`Saving ${service} connection:`, {
      userId: req.user!.id,
      profile: {
        username: profile.username,
        name: profile.name,
        email: profile.email,
        sub: profile.sub
      },
      hasCredentials: !!credentials,
      credentialKeys: Object.keys(credentials || {})
    });

    // Check if connection already exists
    const connections = await storage.getAllAppConnections();
    const existingConnection = connections.find(conn => 
      conn.appId === service && req.user && conn.userId === req.user.id
    );

    console.log(`Existing ${service} connection:`, existingConnection ? {
      id: existingConnection.id,
      username: existingConnection.username,
      hasCredentials: !!existingConnection.credentials
    } : 'None');

    const connectionData = {
      appId: service,
      userId: req.user!.id,
      username: profile.username || profile.name || profile.email || profile.sub || `${service}_user`,
      permissions: ["read", "write"],
      credentials: credentials
    };

    let savedConnection: AppConnection;
    if (existingConnection) {
      // Update existing connection
      console.log(`Updating existing ${service} connection:`, {
        id: existingConnection.id,
        newUsername: connectionData.username
      });
      const updated = await storage.updateAppConnection(existingConnection.id, connectionData);
      if (!updated) {
        throw new Error(`Failed to update ${service} connection`);
      }
      savedConnection = updated;
    } else {
      // Create new connection
      console.log(`Creating new ${service} connection:`, {
        appId: connectionData.appId,
        username: connectionData.username
      });
      savedConnection = await storage.createAppConnection(connectionData);
    }

    console.log(`Successfully saved ${service} connection:`, {
      id: savedConnection.id,
      username: savedConnection.username,
      hasCredentials: !!savedConnection.credentials
    });

    return savedConnection;
  } catch (error) {
    console.error(`Failed to save ${service} connection:`, error);
    throw error;
  }
}

// Development helper for simulated login
// Accepts any service string to support additional OAuth services beyond the main ones
export function getSimulatedAuthUrl(req: Request, service: string, redirectUrl: string): string {
  // We no longer use simulated login by default - only use it if explicitly set
  if (process.env.USE_SIMULATED_LOGIN === 'true') {
    console.log(`Using simulated login for ${service} as USE_SIMULATED_LOGIN is enabled`);
    
    // Generate and store a state parameter for CSRF protection
    const state = generateState();
    storeOAuthState(req, service, state);
    
    // Return URL with state parameter
    return `/api/simulated-login?service=${service}&redirect=${encodeURIComponent(redirectUrl)}&state=${state}`;
  }
  return "";
}