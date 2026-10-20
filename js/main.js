// Dynamic import lets dependency/network/WebGL failures reach a useful screen.
try {
  const {Game}=await import('./game.js');
  const game=new Game(document.getElementById('gameCanvas'));
  function frame(now){try{game.frame(now);requestAnimationFrame(frame);}catch(error){console.error('Game loop stopped safely.',error);game.pause();game.fail('An unexpected error stopped the game. Check the browser console, then reload.');}}
  requestAnimationFrame(frame);
} catch(error){
  console.error('Campus Dash could not start.',error);
  document.getElementById('errorMessage').textContent='Could not load the 3D engine. Start the local server, check your internet connection to the pinned Three.js CDN, and enable WebGL. See README.md for offline setup and troubleshooting.';
  document.getElementById('fatalError').hidden=false;
}
