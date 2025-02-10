'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    // Verifica si existe el token en el localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      // Si no hay token, redirige a la ruta /pages/home
      router.push('/');
    }
  }, [router]);

  return (
    <div>
      Dashboard
    </div>
  );
}

export default Dashboard;
