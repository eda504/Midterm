# Midterm
Render URL: https://midterm-5id1.onrender.com

Reflection: 

1. For this project, I chose to build an infinite side-scrolling platformer survival game based off of the Legend of Zelda where the player runs, jumps, collects rupees (coins), stomps enemies (the red blocks), and tries to survive as long as possible while the screen scrolls faster over time.

2. I built a full CRUD API using Node and Express with an in-memory leaderboard array: GET /api/leaderboard returns the full list of scores, GET /api/leaderboard/:id retrieves a single entry by its index, POST /api/leaderboard creates a new score entry when the player dies, PUT /api/leaderboard/:id updates an existing entry (such as editing name or score), and DELETE /api/leaderboard/:id removes a score from the leaderboard.

3. I use URL parameters by reading ?difficulty=hard (or normal by default) from the game URL with URLSearchParams, which changes the starting hearts to 1 and scroll speed to 3.5 on hard mode to make the game more challenging; for cookies, I store the player's name client-side using document.cookie so the game reads it on load with getCookie, skips the name prompt on future plays, and uses that name automatically when submitting scores to the API.

4. The main animation I added is a sprite-sheet-based character animation on the canvas where the player (Link) switches between standing (3 frames), walking left, and walking right (10 frames each) using frameTimer and frameIndex to cycle through frames at different speeds depending on movement.

5. I challenged myself by using an animation for the Link sprite, since we had never done animation to that extent before. That was a large challenge, since I went through various phases: first, the sprite was just a gray rectangle, then a static picture of Link, then a buggy square version of Link moving, and finally what I have now. 
