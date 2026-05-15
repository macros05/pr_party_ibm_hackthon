import React from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  profile?: {
    bio: string;
    avatar_url: string;
  };
}

interface UserProfileProps {
  user: User;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  return (
    <div className="user-profile" role="article" aria-label={`Profile for ${user.name}`}>
      <div className="user-header">
        {user.profile?.avatar_url && (
          <img 
            src={user.profile.avatar_url} 
            alt={`${user.name}'s avatar`}
            className="avatar"
          />
        )}
        <div className="user-info">
          <h3>{user.name}</h3>
          <p className="email">{user.email}</p>
          <span className="role-badge" aria-label={`Role: ${user.role}`}>
            {user.role}
          </span>
        </div>
      </div>
      {user.profile?.bio && (
        <div className="user-bio">
          <p>{user.profile.bio}</p>
        </div>
      )}
    </div>
  );
};

// Made with Bob
