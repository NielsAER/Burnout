// Facebook SDK initialization
window.fbAsyncInit = function() {
  FB.init({
    appId      : '573274152454213', // Use the Instagram client ID provided by the user
    cookie     : true,
    xfbml      : true,
    version    : 'v17.0'  // Use a compatible version
  });

  // Check login status on page load
  FB.getLoginStatus(function(response) {
    console.log('Facebook login status check:', response);
    
    // Call the statusChangeCallback function with the response
    if (typeof window.statusChangeCallback === 'function') {
      window.statusChangeCallback(response);
    }
  });
};

// Load the Facebook SDK asynchronously
(function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s); js.id = id;
  js.src = "https://connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));