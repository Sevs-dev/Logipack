import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, FileText, AlertCircle } from 'lucide-react';

// Variantes de animación
const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2,
    },
  },
};

const fadeInUp = {
  hidden: { 
    opacity: 0, 
    y: 60,
    scale: 0.95,
    filter: "blur(10px)"
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 100
    }
  },
};

const cardHover = {
  rest: {
    scale: 1,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
  hover: {
    scale: 1.03,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 17
    }
  }
};

function Home() {
  const logos = ['logo1.png', 'logo2.png', 'logo3.png', 'logo4.png'];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <motion.section
        className="bg-gradient-to-br from-blue-900 via-indigo-800 to-blue-700 text-white py-32 relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {/* Cambiar el fondo degradado por una imagen */}
        <motion.div 
          className="absolute inset-0 opacity-30"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          style={{
            backgroundImage: 'url(/fondohome3.jpg)', // Ruta de tu imagen
            backgroundSize: 'cover', // Ajusta la imagen al contenedor
            backgroundRepeat: 'no-repeat', // Evita que la imagen se repita
          }}
        />
        
        <motion.div className="max-w-7xl mx-auto px-4 text-center relative z-10" variants={container}>
          <motion.h1
            className="text-6xl md:text-8xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200"
            variants={fadeInUp}
          >
            Supervisión Integral
          </motion.h1>
          <motion.h2
            className="text-2xl md:text-3xl font-light mb-8 text-blue-100"
            variants={fadeInUp}
          >
            Innovación y Precisión por Logismart
          </motion.h2>
          <motion.p
            className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed text-blue-50"
            variants={fadeInUp}
          >
            Logipack es la solución avanzada que permite controlar, auditar y optimizar cada fase de la fabricación y distribución de medicamentos.
          </motion.p>
          <motion.a
            href="#features"
            className="inline-block bg-white text-blue-900 px-12 py-4 rounded-full font-semibold backdrop-blur-md bg-opacity-90 hover:bg-opacity-100 transition-all"
            variants={fadeInUp}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Descubre más
          </motion.a>
        </motion.div>
      </motion.section>

      {/* Features section con variants corregidos */}
      <motion.section
  id="features"
  className="py-24 bg-gradient-to-br from-white to-gray-50"
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, amount: 0.3 }}
>
  <motion.div className="max-w-7xl mx-auto px-4" variants={container}>
    <motion.h2
      className="text-5xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-blue-900 to-blue-600"
      variants={fadeInUp}
    >
      Características Destacadas
    </motion.h2>
    <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[1, 2, 3].map((_, index) => (
        <motion.div
          key={index}
          className="backdrop-blur-lg bg-white bg-opacity-60 rounded-2xl overflow-hidden"
          variants={fadeInUp}
        >
          <motion.div 
            className="p-8 h-full"
            initial="rest"
            whileHover="hover"
            animate="rest"
            variants={cardHover}
          >
            <motion.div 
              className="h-16 w-16 mb-6"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              {/* Íconos de Lucide */}
              {index === 0 && <Monitor className="text-blue-600 w-full h-full" />}  {/* Control de Fabricación */}
              {index === 1 && <FileText className="text-blue-600 w-full h-full" />}  {/* Auditoría */}
              {index === 2 && <AlertCircle className="text-blue-600 w-full h-full" />}  {/* Reportes de Error */}
            </motion.div>
            <h3 className="text-2xl font-bold mb-4 text-gray-800">
              {["Control de Fabricación", "Auditorías y Compliance", "Reportes en Tiempo Real"][index]}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {[ 
                "Monitorea cada fase de la producción en tiempo real, detecta desviaciones y optimiza procesos para garantizar la máxima calidad.",
                "Realiza auditorías integrales que aseguran el cumplimiento de normativas internacionales.",
                "Accede a análisis y reportes instantáneos que facilitan la toma de decisiones."
              ][index]}
            </p>
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  </motion.div>
</motion.section>

      {/* Logos de clientes - Carrousel */}
      <motion.section
        id="clients"
        className="py-24 bg-gradient-to-br from-white to-gray-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.div className="max-w-7xl mx-auto px-4 text-center">
          <motion.h2
            className="text-5xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-blue-900 to-blue-600"
            variants={fadeInUp}
          >
            Nuestros Clientes
          </motion.h2>

          <motion.div className="overflow-hidden relative">
            <motion.div className="flex space-x-12 animate-marquee w-full">
              {/* Duplica el contenido del carrusel */}
              {[...logos, ...logos].map((logo, index) => (
                <motion.div
                  key={index}
                  className="w-32 md:w-40"
                  variants={fadeInUp}
                >
                  <img src={`/images/${logo}`} alt={`Cliente ${index + 1}`} className="w-full" />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Benefits section con variants corregidos */}
      <motion.section
        id="benefits"
        className="py-24 bg-gradient-to-br from-gray-50 to-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.div className="max-w-7xl mx-auto px-4" variants={container}>
          <motion.h2
            className="text-5xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-blue-900 to-blue-600"
            variants={fadeInUp}
          >
            Beneficios Clave
          </motion.h2>
          <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((_, index) => (
              <motion.div
                key={index}
                className="backdrop-blur-lg bg-white bg-opacity-60 rounded-2xl overflow-hidden"
                variants={fadeInUp}
              >
                <motion.div 
                  className="p-8 h-full"
                  initial="rest"
                  whileHover="hover"
                  animate="rest"
                  variants={cardHover}
                >
                  <h3 className="text-2xl font-bold mb-4 text-gray-800">
                    {[
                      "Eficiencia Operativa",
                      "Seguridad y Confiabilidad",
                      "Innovación Continua",
                      "Soporte Especializado"
                    ][index]}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {[
                      "Incrementa la productividad y reduce errores con procesos automatizados.",
                      "Protege la integridad de tus procesos y asegura el cumplimiento normativo.",
                      "Adáptate a las nuevas tendencias con actualizaciones constantes.",
                      "Disfruta de asistencia técnica y asesoría estratégica personalizada."
                    ][index]}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Contact section permanece igual... */}
      <motion.section
        id="contact"
        className="py-24 bg-gradient-to-br from-blue-900 via-indigo-800 to-blue-700 text-white relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.div 
          className="absolute inset-0 opacity-30"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            backgroundSize: '100% 100%'
          }}
        />
        
        <motion.div className="max-w-7xl mx-auto px-4 text-center relative z-10" variants={container}>
          <motion.h2
            className="text-5xl font-bold mb-8"
            variants={fadeInUp}
          >
            Contacto
          </motion.h2>
          <motion.p
            className="text-xl mb-12 max-w-2xl mx-auto leading-relaxed"
            variants={fadeInUp}
          >
            ¿Listo para transformar tu operación? Nuestro equipo está aquí para ayudarte.
          </motion.p>
          <motion.a
            href="mailto:contacto@logipack.com"
            className="inline-block bg-white text-blue-900 px-12 py-4 rounded-full font-semibold backdrop-blur-md bg-opacity-90 hover:bg-opacity-100"
            variants={fadeInUp}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Contactar Ahora
          </motion.a>
        </motion.div>
      </motion.section>

      {/* Footer permanece igual... */}
      <motion.footer
        className="bg-gray-900 text-gray-400 py-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <motion.div 
          className="max-w-7xl mx-auto px-4 text-center"
          variants={fadeInUp}
        >
          <p>&copy; {new Date().getFullYear()} Logipack. Todos los derechos reservados.</p>
        </motion.div>
      </motion.footer>
    </div>
  );
}

export default Home;