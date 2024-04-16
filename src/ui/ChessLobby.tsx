import React, { useState } from 'react';

import './ChessLobby.css'; // Import CSS file
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"

  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
  
  import { useParams, useNavigate } from 'react-router-dom';

  

const ChessLobby: React.FC = () => {
    const [username, setUsername] = useState<string>('user');
    const [gameLink, setGameLink] = useState<string>('');
    const [joinedGameLink, setJoinedGameLink] = useState<string>('');

    const navigate = useNavigate();

    const handleCreateGame = () => {
        // Logic to create new game and generate game link
        let randomString = Math.random().toString(36).substring(7);

        randomString = 'game/' + username + '/'+ randomString + '/0';

        setGameLink(randomString);
        navigate(randomString);
    };

    const handleJoinGame = () => {
        // Logic to join existing game using the provided game link
        if (joinedGameLink.trim() !== '') {
            // Navigate to game page with joinedGameLink
            navigate(joinedGameLink);

        }
    };

    const generateGameLink = () => {
        // Logic to generate a new game link
        // For simplicity, let's assume it generates a random string
        const randomString = Math.random().toString(36).substring(7);
        return `http://localhost:5173/game/${username}/${randomString}`;
    };

    const playAgainstComputer = () => {
        let randomString = Math.random().toString(36).substring(7);

        randomString = 'game/' + username + '/'+ randomString + '/1';
        // setGameLink(newGameLink);
        navigate(randomString);


    }

    
   


    return (
        <div className='mx-auto mt-24 w-1/3'>
            
        <Card>
        <CardHeader>
        <CardTitle>Chess Lobby</CardTitle>
        <CardDescription>
           Create a new game or join an existing game
        </CardDescription>
        </CardHeader>
        <CardContent>
        <div className="flex flex-col w-full max-w-sm gap-1.5 ">
            <Label htmlFor="username" className='text-left text-sm'>Set Your Name:</Label>
            <Input 
                type="text" 
                id="username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="text-input text-black dark:text-gray-300" 
                placeholder="Enter your name" 
            />
        </div>
            
        </CardContent>
        <CardContent>

        <div className="flex flex-col gap-4  ">
            <Dialog>
                <DialogTrigger asChild>
                    <Button>Create a New Game</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                    <DialogTitle>Create Game</DialogTitle>
                   
                    <DialogDescription>
                        Play with your friends or AI by creating a new game.
                    </DialogDescription>
                    </DialogHeader>

                    <Button onClick={handleCreateGame} >PvP</Button>
                    <Button onClick={playAgainstComputer}>Play with AI</Button>
                    </DialogContent>



                    



            </Dialog>

            {/* <Button onClick={handleJoinGame}>Join a game </Button> */}
            <Dialog>
                <DialogTrigger asChild>
                    <Button>Join a game</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                    <DialogTitle>Join Game</DialogTitle>
                    <DialogDescription>
                        Anyone who has a game link will be join the game.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2">
                        <div className="grid flex-1 gap-2">
                            <Label htmlFor="link" className="sr-only">
                            Link
                            </Label>
                            <Input
                                id="link"
                                type="text" 
                                value={joinedGameLink} 
                                onChange={(e) => setJoinedGameLink(e.target.value)} 
                                className="text-input text-black dark:text-gray-300" 
                                placeholder="Paste the game link here" 
                            />
                        </div>
                        <Button onClick={handleJoinGame} size="sm" className="px-3">
                            Join
                            
                        </Button>
                        
                        </div>
                </DialogContent>
                </Dialog>                        
        </div>
        </CardContent>
        
        </Card>
    </div>
        );
};

export default ChessLobby;
