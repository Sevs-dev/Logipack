import React from 'react';
import { motion } from 'framer-motion';

// Contenedor para aplicar efecto de "stagger" en los elementos hijos
const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

// Variante de animación actualizada para mayor visibilidad
const fadeInUp = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Sección Hero */}
      <motion.section
        className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white py-24"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.div className="max-w-7xl mx-auto px-4 text-center" variants={container}>
          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-4"
            variants={fadeInUp}
            transition={{ duration: 1 }}
          >
            Supervisión Integral en la Industria Farmacéutica
          </motion.h1>
          <motion.h2
            className="text-2xl md:text-3xl font-light mb-6"
            variants={fadeInUp}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Innovación y Precisión por Logismart
          </motion.h2>
          <motion.p
            className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto"
            variants={fadeInUp}
            transition={{ duration: 1, delay: 0.4 }}
          >
            Logipack es la solución avanzada que permite controlar, auditar y optimizar cada fase de la fabricación y distribución de medicamentos, garantizando procesos de alta calidad, seguridad y cumplimiento normativo.
          </motion.p>
          <motion.a
            href="#features"
            className="bg-white text-blue-900 px-10 py-4 rounded-full font-semibold hover:bg-gray-200 transition duration-300"
            variants={fadeInUp}
            transition={{ duration: 1, delay: 0.6 }}
          >
            Descubre más
          </motion.a>
        </motion.div>
      </motion.section>

      {/* Características Destacadas */}
      <motion.section
        id="features"
        className="py-24 bg-gray-100"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.div className="max-w-7xl mx-auto px-4" variants={container}>
          <motion.h2
            className="text-4xl font-bold text-center mb-12 text-gray-800"
            variants={fadeInUp}
            transition={{ duration: 1 }}
          >
            Características Destacadas
          </motion.h2>
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-2xl transition duration-500"
              variants={fadeInUp}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <h3 className="text-2xl font-bold mb-3 text-gray-800">Control de Fabricación</h3>
              <p className="text-gray-600">
                Monitorea cada fase de la producción en tiempo real, detecta desviaciones y optimiza procesos para garantizar la máxima calidad.
              </p>
            </motion.div>
            {/* Feature 2 */}
            <motion.div
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-2xl transition duration-500"
              variants={fadeInUp}
              transition={{ duration: 1, delay: 0.4 }}
            >
              <h3 className="text-2xl font-bold mb-3 text-gray-800">Auditorías y Compliance</h3>
              <p className="text-gray-600">
                Realiza auditorías integrales que aseguran el cumplimiento de normativas internacionales, reduciendo riesgos y garantizando la trazabilidad.
              </p>
            </motion.div>
            {/* Feature 3 */}
            <motion.div
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-2xl transition duration-500"
              variants={fadeInUp}
              transition={{ duration: 1, delay: 0.6 }}
            >
              <h3 className="text-2xl font-bold mb-3 text-gray-800">Reportes en Tiempo Real</h3>
              <p className="text-gray-600">
                Accede a análisis y reportes instantáneos que facilitan la toma de decisiones y permiten ajustes inmediatos en la línea de producción.
              </p>
            </motion.div>
          </motion.div>
          {/* Segunda fila de características */}
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {/* Feature 4 */}
            <motion.div
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-2xl transition duration-500"
              variants={fadeInUp}
              transition={{ duration: 1, delay: 0.8 }}
            >
              <h3 className="text-2xl font-bold mb-3 text-gray-800">Optimización de Procesos</h3>
              <p className="text-gray-600">
                Automatiza tareas repetitivas y mejora la eficiencia operativa, reduciendo costos y tiempos de producción.
              </p>
            </motion.div>
            {/* Feature 5 */}
            <motion.div
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-2xl transition duration-500"
              variants={fadeInUp}
              transition={{ duration: 1, delay: 1.0 }}
            >
              <h3 className="text-2xl font-bold mb-3 text-gray-800">Análisis Predictivo</h3>
              <p className="text-gray-600">
                Utiliza datos en tiempo real y algoritmos avanzados para anticipar problemas y optimizar la producción.
              </p>
            </motion.div>
            {/* Feature 6 */}
            <motion.div
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-2xl transition duration-500"
              variants={fadeInUp}
              transition={{ duration: 1, delay: 1.2 }}
            >
              <h3 className="text-2xl font-bold mb-3 text-gray-800">Integración Total</h3>
              <p className="text-gray-600">
                Conecta sistemas y centraliza información de múltiples fuentes para obtener una visión holística de tus operaciones.
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Acerca de Logipack */}
      <motion.section
        id="about"
        className="py-24 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.div className="max-w-7xl mx-auto px-4" variants={container}>
          <motion.h2
            className="text-4xl font-bold text-center mb-8 text-gray-800"
            variants={fadeInUp}
            transition={{ duration: 1 }}
          >
            Acerca de Logipack
          </motion.h2>
          <motion.p
            className="text-lg text-gray-700 text-center max-w-3xl mx-auto mb-6"
            variants={fadeInUp}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Logipack es una plataforma integral desarrollada por Logismart, líder en soluciones tecnológicas para la industria farmacéutica. Diseñada para ofrecer un control total sobre los procesos de fabricación y distribución, nuestra herramienta integra monitoreo en tiempo real, auditorías detalladas y reportes instantáneos.
          </motion.p>
          <motion.p
            className="text-lg text-gray-700 text-center max-w-3xl mx-auto"
            variants={fadeInUp}
            transition={{ duration: 1, delay: 0.4 }}
          >
            Con una interfaz intuitiva y tecnología de punta, Logipack transforma la gestión operativa, garantizando seguridad, cumplimiento normativo y optimización de recursos en cada etapa del proceso.
          </motion.p>
        </motion.div>
      </motion.section>

      {/* Beneficios Clave */}
      <motion.section
        id="benefits"
        className="py-24 bg-gray-50"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.div className="max-w-7xl mx-auto px-4" variants={container}>
          <motion.h2
            className="text-4xl font-bold text-center mb-12 text-gray-800"
            variants={fadeInUp}
            transition={{ duration: 1 }}
          >
            Beneficios Clave
          </motion.h2>
          <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Beneficio 1 */}
            <motion.div className="p-6" variants={fadeInUp} transition={{ duration: 1, delay: 0.2 }}>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">Eficiencia Operativa</h3>
              <p className="text-gray-600">
                Incrementa la productividad y reduce errores con procesos automatizados y análisis en tiempo real.
              </p>
            </motion.div>
            {/* Beneficio 2 */}
            <motion.div className="p-6" variants={fadeInUp} transition={{ duration: 1, delay: 0.4 }}>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">Seguridad y Confiabilidad</h3>
              <p className="text-gray-600">
                Protege la integridad de tus procesos y asegura el cumplimiento de normativas estrictas.
              </p>
            </motion.div>
            {/* Beneficio 3 */}
            <motion.div className="p-6" variants={fadeInUp} transition={{ duration: 1, delay: 0.6 }}>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">Innovación Continua</h3>
              <p className="text-gray-600">
                Adáptate a las nuevas tendencias con actualizaciones constantes y mejoras basadas en análisis predictivos.
              </p>
            </motion.div>
            {/* Beneficio 4 */}
            <motion.div className="p-6" variants={fadeInUp} transition={{ duration: 1, delay: 0.8 }}>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">Soporte Especializado</h3>
              <p className="text-gray-600">
                Disfruta de asistencia técnica y asesoría estratégica personalizada para maximizar el rendimiento de la plataforma.
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Sección de Contacto */}
      <motion.section
        id="contact"
        className="py-24 bg-gray-100"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.div className="max-w-7xl mx-auto px-4 text-center" variants={container}>
          <motion.h2
            className="text-4xl font-bold mb-8 text-gray-800"
            variants={fadeInUp}
            transition={{ duration: 1 }}
          >
            Contacto
          </motion.h2>
          <motion.p
            className="text-lg text-gray-700 mb-8"
            variants={fadeInUp}
            transition={{ duration: 1, delay: 0.2 }}
          >
            ¿Tienes preguntas o necesitas más información? Nuestro equipo de expertos está listo para ayudarte a llevar tu empresa al siguiente nivel.
          </motion.p>
          <motion.a
            href="mailto:contacto@logipack.com"
            className="bg-blue-600 text-white px-10 py-4 rounded-full font-semibold hover:bg-blue-700 transition duration-300"
            variants={fadeInUp}
            transition={{ duration: 1, delay: 0.4 }}
          >
            Enviar Correo
          </motion.a>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        className="bg-gray-900 text-gray-400 py-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.div className="max-w-7xl mx-auto px-4 text-center" variants={container}>
          <motion.p variants={fadeInUp} transition={{ duration: 1 }}>
            &copy; {new Date().getFullYear()} Logipack. Todos los derechos reservados. Creado por Logismart.
          </motion.p>
        </motion.div>
      </motion.footer>
    </div>
  );
}

export default Home;
