import React, { useState, useEffect, useRef } from 'react';
import Chessboard from 'chessboardjsx';
import io from 'socket.io-client';
import { useParams, useNavigate } from 'react-router-dom';

import toast, { Toaster } from 'react-hot-toast';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { set } from 'react-hook-form';
import { Button } from '@/components/ui/button'; 
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Dialog,DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';


import { Copy, Check, Hourglass, Move, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';

import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

import Message from './Message';





const ChessApp: React.FC = () => {
    const [position, setPosition] = useState<string|null>();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [gameOver, setGameOver] = useState<Boolean>(false);
    const [currentPlayer, setCurrentPlayer] = useState<string>("white");
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [observersCount, setObserversCount] = useState<Number>(0);
    const [playersCount, setPlayersCount] = useState<Number>(0);

    const [role, setRole] = useState<Boolean>(false);//rue for players
    const [clientColor, setClientColor] = useState<string> ("white");
    const [restarters, setRestarters] = useState<Set<string>>(new Set());
    const [restartState, setRestartState] = useState<string>("Request Restart")
    const [opponent, setOpponent] = useState<string>("");
    const [open, setOpen] = useState(true);
    console.log(clientColor)

    const [messageInput, setMessageInput] = useState<string>("")

    // const { gameId } = useParams();
    const navigate = useNavigate();

    const [isAI, setIsAI] = useState<Boolean>(false);
    const [isThinking, setIsThinking] = useState<string>(false);
    const { username,gameId,ai } = useParams(); 
    console.log(username,gameId,ai)

    const [texts, setTexts] = useState<any[]>([]);

    const scrollableDivRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      // Scroll to the bottom of the div when the component mounts or updates
      if (scrollableDivRef.current) {
        scrollableDivRef.current.scrollTop = scrollableDivRef.current.scrollHeight;
      }
    }, []);

    useEffect(() => {
      if (ai == 1){
        setIsAI(true);
      }
    }, [ai]);

    useEffect(() => {
      if (opponent === ''){
        setOpen(true);
      }
      else{
        setOpen(false);
      }

      if (ai == 1){
        setOpponent("Computer");
      }

    },[])

    //store the logs in an array
    const [logs, setLogs] = useState<string[]>([]);

    // Function to add a log to the list
    const addLog = (newLog: string) => {
      setLogs((prevLogs) => [...prevLogs, newLog]);
    };


    useEffect(() => {
        // Establish WebSocket connection when component mounts
        const newSocket = io('https://chess-3.onrender.com'); // Replace with your server URL
        setSocket(newSocket);

       

        // Listen for connect event
        newSocket.on('connect', () => {
            console.log('Connected to server');
            
        });

        newSocket.emit('joinGame', {ai, gameId} );
        
        // newSocket.emit('joinGame',gameId );
        
        newSocket.on('playerColor', (data) =>{
          if (data.gameId === gameId){
            setClientColor(data.playerColor);
          }
        })

        newSocket.on('gameLeft', (data)=>{
          if (data.gameId===gameId){
            alert(data.message);
            navigate("/");
          }
        })

        

        newSocket.on('restartState', (data)=>{
          if (data.gameId === gameId){
            setRestartState(data.message);

          }
        })
        newSocket.on('role', (data:Boolean)=>{
          setRole(data);
        })
        newSocket.on('observers', (data)=>{
          if (data.gameId === gameId){
            setObserversCount(data.observersSize);
          }
        })

        newSocket.on('players', (data:Number)=>{
          setPlayersCount(data);
        } )
        // Listen for initial board state from the server
        newSocket.on('initBoard', (data) => {
            handleAudioPlayback()
            // console.log(data)
            if (gameId===data.gameId){
              setPosition(data.pieces);
              if (data.turn == 'w'){
                setCurrentPlayer("White")
              }
              else{
                setCurrentPlayer("Black");
              }

              if (data.currLog){
                console.log(data.currLog)
                addLog(data.currLog)
              }
            }
            
        });

        newSocket.on('texts', (data)=>{
          console.log(data);
          if (data.gameLink === gameId){
            setTexts(data.texts);

          }
          console.log(texts)
        })

        newSocket.on('leftGame', (data)=>{
          if (gameId === data.gameId){
            alert('Player left the game. New Game started')
            newSocket.emit('resetgame', gameId); 
          }
         
         
        });
        
        // Listen for 'messages' event from the server
        newSocket.on('message', (data) => {
          if (data.gameId===gameId){
            setErrorMessage(data.error);

          }
        });

        newSocket.on('thinking', (data)=>{
          if (data.gameId === gameId){
            setIsThinking(data.value);
          }
        })

        newSocket.on('moveSuccess', (data)=>{
          // console.log("susceces", data.gameId, ai)
          if (data.gameId === gameId && ai == 1){
            console.log("susceces", data.gameId, ai)
            newSocket?.emit('computerHelp', {gameId});

          }
        })

        newSocket.on('error', (data) => {
          if (data.gameId===gameId){
            setErrorMessage(data.error);

          }
        });

        newSocket.on('gameOver', (data) => {
          if (data.gameId === gameId){
            setGameOver(true)

          }
        });

        newSocket.on('chat-text',(data)=>{
          // move-self.play()
          
          console.log('sumit ko chak')
          setText((prevText) => [...prevText, data]); // Update the text state by spreading the previous text array and appending the new data
          console.log(text)

        });



        // Clean up on component unmount
        return () => {
            newSocket.disconnect(); // Close WebSocket connection when component unmounts
        };
    }, []); // Empty dependency array ensures this effect runs only once when component mounts

    const handleMove = ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string }) => {
      // Check if the player is allowed to move based on their color and the current turn
      if ((clientColor === "white" && currentPlayer === "White") || (clientColor === "black" && currentPlayer === "Black")) {
          // Only emit the move if the player's color matches the current turn
          const move = { sourceSquare, targetSquare, gameId };
          socket?.emit('movePiece', move);
      } else {
          // Show an error message if the player tries to move pieces of the wrong color
          setErrorMessage("It's not your turn to move!");
      }
     
  };
  

  const handleAudioPlayback = () => {
    const chessSound = new Audio("https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-self.mp3");
    chessSound.play();
};


const restartGame = () => {
    // socket?.emit('restartRequest', {clientColor, gameId});
    if (ai == 1){
      console.log("restarting")
      socket?.emit('resetgame', {gameId}); 
      setLogs([]);

    }
    else{
      socket?.emit('restartRequest', {clientColor, gameId});

    }
};

  useEffect(() => {
    // Show toast if there's an error message
    if (errorMessage) {
      toast.error(errorMessage);
      setErrorMessage('');
    }
  }, [errorMessage]); // Run this effect whenever errorMessage changes

    const [showTick, setShowTick] = useState(false);

    const handleCopyClick = (gameId: string) => {
      return () => {
          navigator.clipboard.writeText(gameId);
          setShowTick(true);

          // Hide the tick icon after 3 seconds
          setTimeout(() => {
              setShowTick(false);
          }, 3000);
      };
  };




      return (
        <div>
          {
            gameOver &&

            <div className='flex flex-row gap-2'>
              <Dialog open={open}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Game Over</DialogTitle>
                    <DialogDescription>
                      The game has ended
                    </DialogDescription>
                  </DialogHeader>
                  <div className='flex flex-row gap-2'>
                    <Button onClick={() => navigate('/')}>Go to Lobby</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

          }
          {
            !isAI && role && clientColor== 'black' && <div className='flex flex-row gap-2'>
              <Dialog open={open}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Start the game</DialogTitle>
                    <DialogDescription>
                      Set your name
                    </DialogDescription>
                  </DialogHeader>
                  <div className='flex flex-row gap-2'>
                    <Input 
                      type="text" 
                      id="opponent" 
                      value={opponent} 
                      onChange={(e) => setOpponent(e.target.value)} 
                      className="text-input text-black dark:text-gray-300" 
                      placeholder="Enter your name"
                     />
                    <Button onClick={() => {setOpen(false)}}>Set</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          }          
          <div className='outerContainer'>
            <div className='float-left'>
                {observersCount >= 1 && 
                <div className='flex flex-row gap-1'>
                    <VisibilityIcon/>  
                    <p>{observersCount}</p>
                </div>}
            </div>
            <div className='float-right mr-8'>
                {role && 
                <Button onClick={restartGame} disabled={false}>{restartState}</Button>}
            </div>
          </div>
      
          {/* Toaster */}
          <div className="">
            <Toaster
              toastOptions={{
                className: 'bg-black text-white dark:bg-gray-300 dark:text-black',
                position: 'bottom-right',
              }}
            />
          </div>
      
          {/* Container for the grid with margin-top */}
          <div className="pt-20">
     
        <div className="flex flex-row justify-between items-center gap-4">
            {/* Left column */}
            <div className='w-1/2 flex flex-col gap-3'>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Game Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    
                  <div className='flex flex-col gap-2'>
                    <div className={`${currentPlayer === 'White' ? 'text-white bg-slate-800 dark:text-black dark:bg-white' : ''} w-full rounded-full  px-2 py-1`}>⚪️ {username}</div>
                    <div className={`${currentPlayer === 'Black' ? 'text-white bg-slate-800 dark:text-black dark:bg-white' : ''} w-full rounded-full px-2 py-1`}>⚫️ {opponent}</div>
                </div>

                    
                    {/* <p>Game ID: {gameId}</p> */}
                    

                  </CardDescription>
                </CardContent>
                <CardFooter className='flex flex-row justify-between gap-3'>
                    <div className='flex flex-row'>
                      <Copy  onClick={handleCopyClick(gameId)} className='cursor-pointer'/>
                      {showTick && <Check className='text-green-500'/>}
                    </div>
                  <Button onClick={() => navigate('/')}>Leave Game</Button>
                </CardFooter>

              </Card>
            </div>
            
            {
              !isAI &&
            
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Game Log</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                    

                      <ScrollArea className="h-60 w-full rounded-md border">
                        <div className="p-4">
                          {logs.map((log) => (
                            <>
                              <div key={log} className="text-xs text-black dark:text-[#FFFFF0]">
                                {log}
                              </div>
                              <Separator className="my-2" />
                            </>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardDescription>
                  </CardContent>

                </Card>
                </div>
            }
            </div>
                        
            
            {/* Center column */}
            <div>
              <Chessboard
                position={position}
                onDrop={({ sourceSquare, targetSquare }) => handleMove({ sourceSquare, targetSquare })}
                orientation={clientColor} // Adjust orientation based on current player
                draggable={role && !gameOver }
                width={600}
                className="chessboard"
              />
            </div>
            {/* Right column */}
            
            <div className=' w-1/2 items-right h-96'>
            {
              !isAI && 
              <div className='flex flex-col gap-2'>
              <div>
              <Card>
                <CardHeader>
                  <CardTitle>Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                   

                    <div className="h-60 w-full max-w-60  rounded-md border">
                        <ScrollArea className="h-full w-full rounded-md border overflow-y-auto" ref={scrollableDivRef} >
                      <div className=" flex flex-col gap-3 px-4 "  >
                        {texts.map((t) => (
                          <>
                            <Message isOwnMessage={ t.name === username  || t.name === opponent} data={t} />
                            
                            <Separator className="" />
                          </>
                        ))}
                      </div>
                        </ScrollArea>
                    </div>
                  </CardDescription>
                </CardContent>

              </Card>
              </div>

              <form className="message-form flex flex-row gap-2" id="message-form" onSubmit={(event) => {
                  event.preventDefault();

                  console.log(messageInput);
              
                  if (messageInput === "") return;
              
                  const data = {
                      name: clientColor === 'white' ? username : opponent,
                      message: messageInput,
                      dateTime: new Date()
                  };
              
                  
                  socket.emit('addNewText', {gameId, textData:data});
              
                  setMessageInput("");

                }}>
                  {
                      role &&
                      <div className='flex flex-row gap-5'>
                <Input
                type="text"
                name="message"
                id="message-input"
                className="text-input text-black dark:text-gray-300 w-full"
                value={messageInput}
                
                onChange={(event) => setMessageInput(event.target.value)}
                />
                <div className="v-divider"></div>
                  <Button type="submit" className="send-button">
                      <Send/> <span><i className="fas fa-paper-plane"></i></span>
                  </Button>
                </div>
                }
            </form>

                
            </div>

}

{
  isAI &&
  
  <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Game Log</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                    

                      <ScrollArea className="h-60 w-full rounded-md border">
                        <div className="p-4">
                          {logs.map((log) => (
                            <>
                              <div key={log} className="text-xs text-black dark:text-[#FFFFF0]">
                                {log}
                              </div>
                              <Separator className="my-2" />
                            </>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardDescription>
                  </CardContent>

                </Card>
                </div>
            }
            
            </div>
        </div>
              
      </div>
    </div>
              

      );
      
      
};

export default ChessApp;
