const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIo = require('socket.io');
const { Chess } = require('chess.js');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: ["http://localhost:5173", "https://thinknmove.netlify.app"] // Assuming this is your frontend URL
    }
});

const minimax = require('./ai.js');// Enable CORS for all routes
const { text } = require('stream/consumers');
app.use(cors());

const pieceTypes = new Map([
  ['p', 'Pawn'],
  ['n', 'Knight'],
  ['b', 'Bishop'],
  ['r', 'Rook'],
  ['q', 'Queen'],
  ['k', 'King']
]);

// Maintain a map of game links to players, observers, and restarters
const logs =new Map();
const texts = new Map();
const gameSessions = new Map();
const client_Game = new Map();
// Initialize map to track captured pieces for each player
const capturedPieces = new Map();
// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('New connection');
    const clientId = uuidv4();

    socket.on('joinGame', (data) => {
        // Create a new game session if it doesn't exist
        const gameLink = data.gameId;
        const ai = data.ai;
        if (!gameSessions.has(gameLink)) {
            gameSessions.set(gameLink, {
                game: new Chess(),
                players: new Set(),
                observers: new Set(),
                restarters: new Set()
            });
        }
        if (!logs.has(gameLink)){
          logs.set(gameLink, [])
        }
        if (!texts.has(gameLink)){
          texts.set(gameLink, [])
        };


        // Assign the player to the corresponding game session
        const session = gameSessions.get(gameLink);
        const players = session.players;
        const observers = session.observers;
        const restarters = session.restarters;
        const game = session.game;


        
        // ----------------------AI-----------------------------------


        //--------------------------AI ENDS---------------------------
      

        
        // Determine if the player limit has been reached
      // const playerLimit = ai == 1? 1: 2;
      if (ai == 1){
        if (players.size >= 1) {
          // If the player limit is reached, add the client as an observer
          socket.emit('redirectToLobby', {gameId:gameLink})
    
        } else {
            
            players.add(clientId);
            socket.emit('playerColor', {playerColor:"white", gameId:gameLink});

           
            socket.emit('role', true)
        }
      }
      else{

      
        if (players.size >= 2) {
          // If the player limit is reached, add the client as an observer
          observers.add(clientId);
          io.emit('observers', {observersSize:observers.size, gameId:gameLink});
          console.log("adding an observer")

          socket.emit('role', false)
    
        } else {
            // If there are fewer than 2 players, add the client as a player
            console.log("adding a player")
            players.add(clientId);

            if (players.size == 1){
              socket.emit('playerColor', {playerColor:"white", gameId:gameLink});

            }
            else  if (players.size == 2){
              socket.emit('playerColor', {playerColor:"black", gameId:gameLink});

            }
            socket.emit('role', true)
        }
      }
      if (!client_Game.has(clientId)){
          client_Game.set(clientId, gameLink);

      }


          // Send the initial board state to the client
      socket.emit('initBoard', { pieces: session.game.fen(), turn: session.game.turn(), gameId: gameLink });
    });

    socket.on('computerHelp', (data)=>{
      console.log("best moved")

      const gameLink = data.gameId;
        const session = gameSessions.get(gameLink);
        console.log("best moved")

        // console.log(session)
        if (!session) {
          console.log("computer move", gameLink)

            return; // Game session not found
        }

        const { game, players } = session;
                  // Set parameters
                  const depth = 3; // Set the desired depth for the minimax search
                  const alpha = Number.NEGATIVE_INFINITY;
                  const beta = Number.POSITIVE_INFINITY;
                  const isMaximizingPlayer = true; // Assuming it's the maximizing player's turn
                  let sum = 0; // Initial evaluation sum
                  const color = game.turn(); // Determine the color of the current player
        
                  // Call the minimax function
                  io.emit('thinking', {gameId:gameLink, value:true })
                  const [bestMove, evaluation] = minimax(game, depth, alpha, beta, isMaximizingPlayer, sum, color);
                  io.emit('thinking', {gameId:gameLink, value:false })

                  // Make the best move
                  if (bestMove !== null) {
                      const move = game.move(bestMove);
                      const currTurn = "black";
                      const movingPiece = game.get(bestMove.to).type; 
                      let currLog = "";

                      if (move.captured) {
                        const capturedPiece = move.captured;

                        const playerColor = move.color === 'w' ? 'black' : 'white';
                        // Update captured pieces for the respective player
                        if (!capturedPieces.has(playerColor)) {
                            capturedPieces.set(playerColor, []);
                        }

                        capturedPieces.get(playerColor).push(capturedPiece);
                      currLog = currTurn + " captured " + pieceTypes.get(move.captured) + " with " + pieceTypes.get(movingPiece) + " from " + bestMove.from + " to " + bestMove.to + "\n";
                        logs.get(gameLink).push(currLog);
                      } else {
                        currLog = currTurn + " moved " + pieceTypes.get(movingPiece) + " from " + bestMove.from + " to " + bestMove.to + "\n";
                        logs.get(gameLink).push(currLog);
                      }

                    
                      io.emit('initBoard', { pieces: game.fen(), turn: game.turn(), gameId:gameLink, currLog, capturedPiece:game.move.captured });
                      // check game over
                      if (game.inCheck()){
                        io.emit('message', {message:'The King is in check!',gameId:gameLink});
                      }

                      // Check for game over conditions
                      if (game.isCheckmate()) {
                        const winner = game.turn() === 'w' ? 'black' : 'white';
                        io.emit('gameOver', { winner, gameId: gameLink });
                        io.emit('message', {message:'The game is over! Restart to play again!',gameId:gameLink});

                      } else if (game.isStalemate()) {
                          io.emit('gameOver', { winner: 'draw', gameId: gameLink });
                          io.emit('message', {message:'The game is over! Restart to play again!',gameId:gameLink});

                      }



                      // console.log("Best move:", bestMove);
                      // console.log("Evaluation:", evaluation);
        
                      
                  } else {
                      console.log("No valid move found.");
                  }
    })

    // Handle move requests from the client
    socket.on('movePiece', (data) => {

        const gameLink = data.gameId;
        const session = gameSessions.get(gameLink);
        

        if (!session) {
          console.log("making move", gameLink)

            return; // Game session not found
        }

        const { game, players } = session;
        try {
          io.emit('message', '');

          const currTurn = game.turn() === 'w'? "white":"black";
          const movingPiece = game.get(data.sourceSquare).type; 
          

          const move = game.move({
              from: data.sourceSquare,
              to: data.targetSquare,
              promotion: 'q', // promote to queen by default
          });

          if (move !== null) {
             
              //push back to logs
              let currLog = "";
              if (move.captured) {
                const capturedPiece = move.captured;
                const playerColor = move.color === 'w' ? 'black' : 'white';
                // Update captured pieces for the respective player
                if (!capturedPieces.has(playerColor)) {
                    capturedPieces.set(playerColor, []);
                }
                capturedPieces.get(playerColor).push(capturedPiece);
              currLog = currTurn + " captured " + pieceTypes.get(move.captured) + " with " + pieceTypes.get(movingPiece) + " from " + data.sourceSquare + " to " + data.targetSquare + "\n";
                logs.get(gameLink).push(currTurn + " captured " + pieceTypes.get(move.captured) + " with " + pieceTypes.get(movingPiece) + " from " + data.sourceSquare + " to " + data.targetSquare + "\n");
            } else {
              currLog = currTurn + " moved " + pieceTypes.get(movingPiece) + " from " + data.sourceSquare + " to " + data.targetSquare + "\n";
                logs.get(gameLink).push(currTurn + " moved " + pieceTypes.get(movingPiece) + " from " + data.sourceSquare + " to " + data.targetSquare + "\n");
            }

             // If move is valid, update the game state and emit it to all clients
             io.emit('initBoard', { pieces: game.fen(), turn: game.turn(), gameId:gameLink, currLog, capturedPiece:move.captured });
             io.emit('moveSuccess', {gameId:gameLink});
            

              socket.emit('error', {error:'', gameId:gameLink});


          } else {
              // If move is invalid, emit an error message to the specific client
              socket.emit('error', {error:'Invalid move. Please try again.', gameId:gameLink});
          }


          // check game over
          if (game.inCheck()){
            io.emit('message', {message:'The King is in check!',gameId:gameLink});
          }

           // Check for game over conditions
           if (game.isCheckmate()) {
            const winner = game.turn() === 'w' ? 'black' : 'white';
            io.emit('gameOver', { winner, gameId: gameLink });
            io.emit('message', {message:'The game is over! Restart to play again!',gameId:gameLink});

          } else if (game.isStalemate()) {
              io.emit('gameOver', { winner: 'draw', gameId: gameLink });
              io.emit('message', {message:'The game is over! Restart to play again!',gameId:gameLink});

          }


          
         
      } catch (error) {
          console.error('Error during move calculation:', error);
          // If an error occurs, emit an error message to the specific client
          socket.emit('error', {error:'Error during move calculation. Please try again.', gameId:gameLink});
      }


       
    });

    // Handle the rest of your socket event handlers here...
    socket.on('restartRequest', (data)=>{
      const gameLink = data.gameId;
      const session = gameSessions.get(gameLink);

      if (!session) {
        console.log("making restart", gameLink)

          return; // Game session not found
      }

      const { game, restarters } = session;
      if (!restarters.has(data)){
        restarters.add(data);

        if (restarters.size == 1){
          socket.emit('restartState', {message:"Request Pending", gameId:gameLink})
          socket.broadcast.emit('restartState', {message:"Accept Restart Request", gameId:gameLink})
        }

      }
      if (restarters.size === 2){
        game.reset();
        io.emit('initBoard', { pieces: game.fen(), turn: game.turn(), gameId:gameLink });
        io.emit('restartState', {message:"Request Restart", gameId:gameLink})
        // io.emit('gameover', {gameId:gameLink, gameOver:false});
        io.emit('message', {error:'', gameId:gameLink});

        restarters.clear();
      }
      

  })

  //reset game when opponent leaves
  socket.on('resetgame', (data)=>{
    console.log("game id is ", data.gameId)
    const gameLink = data.gameId;
    const session = gameSessions.get(gameLink);

    if (!session) {
      console.log("making reset", gameLink)

        return; // Game session not found
    }

    const { game, restarters } = session;
    game.reset();
    io.emit('initBoard', { pieces: game.fen(), turn: game.turn(), gameId:gameLink });
    io.emit('restartState', {message:"Restart Game", gameId:gameLink})
    // io.emit('gameover', {gameId:gameLink});
    io.emit('message', {error:'', gameId:gameLink});


    restarters.clear();
    io.emit('playerColor', {playerColor:"white", gameId:gameLink});

  })

  // for text message
  socket.on('addNewText',(data)=>{
    console.log(data)
    texts.get(data.gameId).push(data.textData)
    io.emit('texts',{gameLink:data.gameId, texts:texts.get(data.gameId)})
  })

  // Handle disconnect event
  socket.on('disconnect', () => {
    //get the client id
    //get the client's game session
    //delete client from the relevant list
    //emit on new message for Game Left..which will expire the current game session and navigate back to lobby
    const gameLink = client_Game.get(clientId);
    console.log(gameLink)
    const session = gameSessions.get(gameLink);
    if (!session) {
      console.log("disconnect session not found", gameLink)

        return; // Game session not found
    }

    const {game, observers, players, restarters} = session;
    if (observers.has(clientId)){

      observers.delete(clientId);
      io.emit('observers', {observersSize: observers.size, gameId:gameLink});

    }
    else if (players.has(clientId)){
      console.log(`Player ${clientId} left the game`);

      players.delete(clientId);
      io.emit('players', {playersSize:players.size, gameId:gameLink});
      io.emit('gameOver', {});

      io.emit('gameLeft', {message:'One or both players left the game. Redirecting to Lobby!', gameId:gameLink});




    }

  });
  
});

// Route to get the number of active connections
app.get('/connections', (req, res) => {
    res.json({ count: io.engine.clientsCount });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});