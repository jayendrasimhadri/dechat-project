import React, { createContext, useContext, useState } from 'react';

const FriendsContext = createContext();

export const useFriends = () => {
    const context = useContext(FriendsContext);
    if (!context) {
        throw new Error('useFriends must be used within a FriendsProvider');
    }
    return context;
};

export const FriendsProvider = ({ children }) => {
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);

    const addFriend = (friendData) => {
        setFriends(prev => [...prev, { ...friendData, id: Date.now() }]);
    };

    const removeFriend = (friendId) => {
        setFriends(prev => prev.filter(friend => friend.id !== friendId));
    };

    const sendFriendRequest = (userData) => {
        const request = {
            id: Date.now(),
            ...userData,
            timestamp: new Date().toISOString()
        };
        setSentRequests(prev => [...prev, request]);
    };

    const acceptFriendRequest = (requestId) => {
        const request = friendRequests.find(req => req.id === requestId);
        if (request) {
            addFriend(request);
            setFriendRequests(prev => prev.filter(req => req.id !== requestId));
        }
    };

    const rejectFriendRequest = (requestId) => {
        setFriendRequests(prev => prev.filter(req => req.id !== requestId));
    };

    const receiveFriendRequest = (requestData) => {
        const request = {
            id: Date.now(),
            ...requestData,
            timestamp: new Date().toISOString()
        };
        setFriendRequests(prev => [...prev, request]);
    };

    const value = {
        friends,
        friendRequests,
        sentRequests,
        addFriend,
        removeFriend,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        receiveFriendRequest
    };

    return (
        <FriendsContext.Provider value={value}>
            {children}
        </FriendsContext.Provider>
    );
};