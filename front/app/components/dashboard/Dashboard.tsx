'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import nookies from 'nookies';

function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    // Obtiene todas las cookies en el cliente
    const cookies = nookies.get(null);
    console.log('Cookies leídas:', cookies);
    const token = cookies.token; 
    if (!token) {
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
