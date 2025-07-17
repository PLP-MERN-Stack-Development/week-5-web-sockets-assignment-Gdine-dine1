import React from 'react';

const UserList = ({ users, currentUser, onSelectUser, open }) => (
  <div className={`user-list${open ? ' open' : ''} bg-white border-r p-4 min-w-[200px] transition-all` }>
    <h3 className="font-bold mb-2">Online Users</h3>
    <ul className="list-none p-0">
      {users.map((user) => (
        <li
          key={user.id}
          className={`mb-2 cursor-pointer ${user.username === currentUser ? 'font-bold text-blue-600' : 'text-gray-800'}`}
          onClick={() => onSelectUser && onSelectUser(user)}
        >
          <span className="mr-2 text-green-500">●</span>
          {user.username}
        </li>
      ))}
    </ul>
  </div>
);

export default UserList; 