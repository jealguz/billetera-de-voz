// Polyfill para process object
if (typeof window.process === 'undefined') {
  window.process = {
    env: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PUBLIC_URL: process.env.PUBLIC_URL || ''
    },
    cwd: function() { return ''; },
    versions: {
      node: '16.0.0'
    }
  };
}