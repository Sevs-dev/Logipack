import React from 'react';

function User() {
  const user = {
    name: 'Juan Pérez',
    email: 'juan.perez@example.com',
    created_at: '2023-01-01T12:00:00Z'
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Perfil de Usuario</h1>
      <div className="mb-2">
        <span className="font-semibold">Nombre:</span> {user.name}
      </div>
      <div className="mb-2">
        <span className="font-semibold">Email:</span> {user.email}
      </div>
      <div className="mb-2">
        <span className="font-semibold">Fecha de Registro:</span> {new Date(user.created_at).toLocaleDateString()}
      </div>
    </div>
  );
}

export default User;
