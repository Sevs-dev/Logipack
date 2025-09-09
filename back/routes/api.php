<?php

use App\Http\Controllers\ActivitiesController;
use App\Http\Controllers\ArticlesController;
use Illuminate\Http\Request;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClientsController;
use App\Http\Controllers\FactoryController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MaestrasController;
use App\Http\Controllers\ManufacturingController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\RolesController;
use App\Http\Controllers\StagesController;
use App\Http\Controllers\AdaptationController;
use App\Http\Controllers\AdaptationDateController;
use App\Http\Controllers\ConsecutiveController;
use App\Http\Controllers\MachineryController;
use App\Http\Controllers\TipoAcondicionamientoController;
use App\Http\Controllers\LineaTipoAcondicionamientoController;
use App\Http\Controllers\OrdenesEjecutadasController;
use App\Http\Controllers\HistoryAuditController;
use App\Http\Controllers\TimerController;
use App\Http\Controllers\FaseTimerController;
use App\Http\Controllers\TimerControlController;

/**
 * ============================
 *        AUTH / USUARIOS
 * ============================
 * Controla login, registro, sesión y utilidades de usuario.
 * Notas:
 * - JWT/cookies según tu implementación.
 * - Algunos endpoints incluyen throttle.
 */
Route::controller(AuthController::class)->group(function () {
    // POST /login — Iniciar sesión (email, password). Responde con token/usuario.
    Route::post('login', 'login');

    // POST /register — Registrar usuario nuevo.
    Route::post('register', 'register');

    // POST /logout — Cerrar sesión (invalidar token/refresh).
    Route::post('logout', 'logout');

    // POST /refresh — Renovar token.
    Route::post('refresh', 'refresh');

    // GET /user/{email} — Obtener usuario por email.
    Route::get('/user/{email}', 'getUserByEmail');

    // POST /edit-image/{email} — Actualizar imagen de perfil por email.
    Route::post('/edit-image/{email}', 'EditImage');

    // POST /users/upload-image — Subir imagen de usuario (multipart/form-data).
    Route::post('/users/upload-image',  'uploadUserImage');

    // POST /users — Crear usuario (con rol, etc.).
    Route::post('/users', 'create');

    // GET /role — Listar roles del usuario autenticado (o info de rol actual).
    Route::get('/role', 'role');

    // GET /usersAll — Listar todos los usuarios.
    Route::get('/usersAll', 'getUsers');

    // DELETE /delete/{id} — Eliminar usuario por id.
    Route::delete('/delete/{id}', 'getUserDelete');

    // PUT /update/{id} — Actualizar usuario por id.
    Route::put('/update/{id}', 'getUserUpdate');

    // GET /date/{id} — Obtener usuario por id (detalle).
    Route::get('/date/{id}', 'getuserById');

    // POST /auth/validate-signature-pass — Validar pass de firma (rate limited).
    Route::post('/auth/validate-signature-pass', 'validateSignaturePass')
        ->name('auth.validate-signature-pass')
        ->middleware('throttle:60,1'); // limitar intentos

    // ♻️ Legacy/Compat — Validar pass de seguridad por rol.
    Route::post('/users/validate-security-pass', 'validateSecurityPassByRole')
        ->name('users.validate-security-pass');
});

/**
 * ============================
 *        PERMISOS (ACL)
 * ============================
 * Alta/baja/consulta de permisos y asignación a roles.
 */
Route::controller(PermissionController::class)->group(function () {
    // POST /newPermission — Crear permiso.
    Route::post('/newPermission', 'createPermission');

    // GET /permissions — Listar permisos.
    Route::get('/permissions', 'getPermisos');

    // POST /permissionsUpdate — Asignar/actualizar permisos por rol.
    Route::post('/permissionsUpdate', 'updateRolePermissions');

    // GET /role-permissions/{roleName} — Permisos por nombre de rol.
    Route::get('/role-permissions/{roleName}', 'getPermissionsByRoleName');

    // DELETE /deletePermission/{id} — Eliminar permiso por id.
    Route::delete('/deletePermission/{id}', 'deletePermission');

    // GET /PermissionId/{id} — Obtener permiso por id.
    Route::get('/PermissionId/{id}', 'permissionId');

    // PUT /updatePermission/{id} — Actualizar permiso por id.
    Route::put('/updatePermission/{id}', 'updatePermission');
});

/**
 * ============================
 *             ROLES
 * ============================
 * CRUD de roles del sistema.
 */
Route::controller(RolesController::class)->group(function () {
    // GET /getRole — Listar roles.
    Route::get('/getRole', 'getRole');

    // POST /newRole — Crear rol.
    Route::post('/newRole', 'newRole');

    // GET /RoleId/{id} — Obtener rol por id.
    Route::get('/RoleId/{id}', 'RoleId');

    // PUT /updateRole/{id} — Actualizar rol por id.
    Route::put('/updateRole/{id}', 'updateRole');

    // DELETE /deleteRole/{id} — Eliminar rol por id.
    Route::delete('/deleteRole/{id}', 'deleteRole');
});

/**
 * ============================
 *           FÁBRICAS
 * ============================
 * CRUD de fábricas/plantas.
 */
Route::controller(FactoryController::class)->group(function () {
    // GET /getFactories — Listar fábricas.
    Route::get('/getFactories', 'getFactories');

    // POST /newFactory — Crear fábrica.
    Route::post('/newFactory', 'newFactory');

    // GET /factoryId/{id} — Detalle de fábrica por id.
    Route::get('/factoryId/{id}', 'factoryId');

    // PUT /updateFactory/{id} — Actualizar fábrica.
    Route::put('/updateFactory/{id}', 'updateFactory');

    // DELETE /deleteFactory/{id} — Eliminar fábrica.
    Route::delete('/deleteFactory/{id}', 'deleteFactory');
});

/**
 * ============================
 *            LÍNEAS
 * ============================
 * CRUD de líneas de manufactura.
 */
Route::controller(ManufacturingController::class)->group(function () {
    // GET /getManu — Listar líneas.
    Route::get('/getManu', 'getManu');

    // POST /newManu — Crear línea.
    Route::post('/newManu', 'newManu');

    // GET /ManuId/{id} — Detalle de línea por id.
    Route::get('/ManuId/{id}', 'ManuId');

    // PUT /updateManu/{id} — Actualizar línea.
    Route::put('/updateManu/{id}', 'updateManu');

    // DELETE /deleteManu/{id} — Eliminar línea.
    Route::delete('/deleteManu/{id}', 'deleteManu');
});

/**
 * ============================
 *          MAQUINARIA
 * ============================
 * CRUD de equipos/maquinaria.
 */
Route::controller(MachineryController::class)->group(function () {
    // GET /getMachin — Listar maquinaria.
    Route::get('/getMachin', 'getMachin');

    // POST /newMachin — Crear máquina/equipo.
    Route::post('/newMachin', 'newMachin');

    // GET /MachinId/{id} — Detalle de máquina por id.
    Route::get('/MachinId/{id}', 'MachinId');

    // PUT /updateMachin/{id} — Actualizar máquina.
    Route::put('/updateMachin/{id}', 'updateMachin');

    // DELETE /deleteMachin/{id} — Eliminar máquina.
    Route::delete('/deleteMachin/{id}', 'deleteMachin');
});

/**
 * ============================
 *           CLIENTES
 * ============================
 * CRUD y sincronización de clientes.
 */
Route::controller(ClientsController::class)->group(function () {
    // GET /clients/sync — Sincronizar/traer clientes desde API externa.
    Route::get('/clients/sync', 'getClientDataApi');

    // GET /getClients — Listar clientes.
    Route::get('/getClients', 'getClients');

    // POST /newClients — Crear cliente.
    Route::post('/newClients', 'newClients');

    // GET /ClientsId/{id} — Detalle de cliente por id.
    Route::get('/ClientsId/{id}', 'ClientsId');

    // PUT /updateClients/{id} — Actualizar cliente.
    Route::put('/updateClients/{id}', 'updateClients');

    // DELETE /deleteClients/{id} — Eliminar cliente.
    Route::delete('/deleteClients/{id}', 'deleteClients');
});

/**
 * ============================
 *           PRODUCTOS
 * ============================
 * CRUD de productos/artículos base (catálogo).
 */
Route::controller(ProductController::class)->group(function () {
    // GET /getProduct — Listar productos.
    Route::get('/getProduct', 'getProduct');

    // POST /newProduct — Crear producto.
    Route::post('/newProduct', 'newProduct');

    // GET /ProductId/{id} — Detalle de producto por id.
    Route::get('/ProductId/{id}', 'ProductId');

    // GET /ProductName/{name} — Buscar producto por nombre.
    Route::get('/ProductName/{name}', 'ProductName');

    // PUT /updateProduct/{id} — Actualizar producto.
    Route::put('/updateProduct/{id}', 'updateProduct');

    // DELETE /deleteProduct/{id} — Eliminar producto.
    Route::delete('/deleteProduct/{id}', 'deleteProduct');
});

/**
 * ============================
 *            MAESTRAS
 * ============================
 * CRUD de “maestras” (plantillas/configuraciones) y tipos.
 */
Route::controller(MaestrasController::class)->group(function () {
    // GET /getMaestra — Listar maestras.
    Route::get('/getMaestra', 'getMaestra');

    // GET /getMuestreo/{id} — Obtener configuración de muestreo por id de maestra.
    Route::get('/getMuestreo/{id}', 'getMuestreo');

    // POST /newMaestra — Crear maestra.
    Route::post('/newMaestra', 'newMaestra');

    // GET /MaestraId/{id} — Detalle de maestra por id.
    Route::get('/MaestraId/{id}', 'MaestraId');

    // GET /MaestraName/{name} — Buscar maestra por nombre.
    Route::get('/MaestraName/{name}', 'MaestraName');

    // PUT /updateMaestra/{id} — Actualizar maestra.
    Route::put('/updateMaestra/{id}', 'updateMaestra');

    // DELETE /deleteMaestra/{id} — Eliminar maestra.
    Route::delete('/deleteMaestra/{id}', 'deleteMaestra');

    // GET /getTipo — Listar tipos de maestra.
    Route::get('/getTipo', 'obtenerTipos');
});

/**
 * ============================
 *             FASES
 * ============================
 * CRUD de fases de proceso y controles asociados.
 */
Route::controller(StagesController::class)->group(function () {
    // GET /getFase — Listar fases.
    Route::get('/getFase', 'getFase');

    // POST /newFase — Crear fase.
    Route::post('/newFase', 'newFase');

    // GET /FaseId/{id} — Detalle de fase por id.
    Route::get('/FaseId/{id}', 'FaseId');

    // GET /controlStages/{id} — Controles/config de fase por id.
    Route::get('/controlStages/{id}', 'controlStages');

    // GET /FaseName/{name} — Buscar fase por nombre.
    Route::get('/FaseName/{name}', 'FaseName');

    // PUT /updateFase/{id} — Actualizar fase.
    Route::put('/updateFase/{id}', 'updateFase');

    // DELETE /deleteFase/{id} — Eliminar fase.
    Route::delete('/deleteFase/{id}', 'deleteFase');
});

/**
 * ============================
 *          ACTIVIDADES
 * ============================
 * CRUD de actividades asociadas a fases/controles.
 */
Route::controller(ActivitiesController::class)->group(function () {
    // GET /getActividad — Listar actividades.
    Route::get('/getActividad', 'getActividad');

    // POST /newActividad — Crear actividad.
    Route::post('/newActividad', 'newActividad');

    // GET /ActividadId/{id} — Detalle de actividad por id.
    Route::get('/ActividadId/{id}', 'ActividadId');

    // PUT /updateActividad/{id} — Actualizar actividad.
    Route::put('/updateActividad/{id}', 'updateActividad');

    // DELETE /deleteActividad/{id} — Eliminar actividad.
    Route::delete('/deleteActividad/{id}', 'deleteActividad');
});

/**
 * ============================
 *           ARTÍCULOS
 * ============================
 * CRUD y consultas: artículos (con BOM), por código/cliente.
 */
Route::controller(ArticlesController::class)->group(function () {
    // GET /getArticle — Listar artículos.
    Route::get('/getArticle', 'getArticle');

    // GET /getBom — Listar todos los BOMs disponibles.
    Route::get('/getBom', 'getAllBoms');

    // POST /newArticle — Crear artículo.
    Route::post('/newArticle', 'newArticle');

    // GET /getCode/{code} — Buscar artículo por código.
    Route::get('/getCode/{code}', 'getArticlesByCoddiv');

    // GET /getArticleId/{id} — Detalle de artículo por id.
    Route::get('/getArticleId/{id}', 'getArticleById');

    // GET /getArticleByClientId/{id} — Listar artículos por id de cliente.
    Route::get('/getArticleByClientId/{id}', 'getArticleByClientId');

    // PUT /updateArticle/{id} — Actualizar artículo.
    Route::put('/updateArticle/{id}', 'updateArticle');

    // DELETE /deleteArticle/{id} — Eliminar artículo.
    Route::delete('/deleteArticle/{id}', 'deleteArticle');
});

/**
 * ============================
 *      ACONDICIONAMIENTOS
 * ============================
 * CRUD de Acondicionamientos y utilidades (adjuntos, debug BOM).
 */
Route::controller(AdaptationController::class)->group(function () {
    // GET /getAdaptation — Listar acondicionamientos.
    Route::get('/getAdaptation', 'getAdaptation');

    // POST /newAdaptation — Crear acondicionamiento.
    Route::post('/newAdaptation', 'newAdaptation');

    // POST /newAttachment — Subir adjunto de acondicionamiento.
    Route::post('/newAttachment', 'uploadAttachment');

    // GET /getAdaptationId/{id} — Detalle por id.
    Route::get('/getAdaptationId/{id}', 'getAdaptationById');

    // PUT /updateAdaptation/{id} — Actualizar acondicionamiento.
    Route::put('/updateAdaptation/{id}', 'updateAdaptation');

    // DELETE /deleteAdaptation/{id} — Eliminar acondicionamiento.
    Route::delete('/deleteAdaptation/{id}', 'deleteAdaptation');

    // GET /debug/adaptation/{id} — Debug BOM/ingredientes para un acondicionamiento.
    Route::get('/debug/adaptation/{id}', 'debugBomAndIngredients');
});

/**
 * ============================
 *         PLANIFICACIÓN
 * ============================
 * CRUD/consultas de planes de producción y PDF.
 */
Route::controller(AdaptationDateController::class)->group(function () {
    // GET /getPlan — Listar planes (paginación/filtros según controller).
    Route::get('/getPlan', 'getPlan');

    // GET /getPlanDash — KPIs/agrupaciones para dashboard.
    Route::get('/getPlanDash', 'getPlanDash');

    // POST /newPlan — Crear planificación.
    Route::post('/newPlan', 'newAPlan');

    // PUT /updatePlan/{id} — Actualizar plan por id.
    Route::put('/updatePlan/{id}', 'update');

    // GET /getPlanId/{id} — Detalle de plan por id.
    Route::get('/getPlanId/{id}', 'getPlanById');

    // GET /getPlannId/{id} — Detalle único (variación/compat).
    Route::get('/getPlannId/{id}', 'getPlanUnic');

    // GET /getPlanByIdPDF/{id} — Datos listos para PDF (JSON).
    Route::get('/getPlanByIdPDF/{id}', 'getPlanByIdPDF');

    // GET /pdf/plan/{id} — Render de PDF (vista).
    Route::get('/pdf/plan/{id}', 'generatePDFView');

    // GET /consult-planning — Consulta compuesta (unifica varias fuentes).
    Route::get('/consult-planning', 'getConsultPlanning');

    // DELETE /deletePlan/{id} — Eliminar plan.
    Route::delete('/deletePlan/{id}', 'destroy');
});

/**
 * ============================
 *         CONSECUTIVOS
 * ============================
 * Gestión de consecutivos y prefijos.
 */
Route::controller(ConsecutiveController::class)->group(function () {
    // GET /getConsecutive — Listar consecutivos.
    Route::get('/getConsecutive', 'getAll');

    // GET /getConsecutiveDate — Listar consecutivos por fecha (o fechas asociadas).
    Route::get('/getConsecutiveDate', 'getAllConsecutiveDates');

    // GET /getPrefix/{prefix} — Consultar consecutivo por prefijo.
    Route::get('/getPrefix/{prefix}', 'getPrefix');

    // PUT /updateConsecutive/{id} — Actualizar consecutivo.
    Route::put('/updateConsecutive/{id}', 'update');
});

/**
 * =========================================
 *     TIPOS DE ACONDICIONAMIENTO (Catálogo)
 * =========================================
 */
Route::controller(TipoAcondicionamientoController::class)->group(function () {
    // GET /getTipoAcondicionamiento — Listar tipos.
    Route::get('/getTipoAcondicionamiento', 'getAll');

    // GET /getTipoAcondicionamientoId/{id} — Detalle de tipo por id.
    Route::get('/getTipoAcondicionamientoId/{id}', 'getTipoAcondicionamiento');

    // POST /newTipoAcondicionamiento — Crear tipo.
    Route::post('/newTipoAcondicionamiento', 'newTipoAcondicionamiento');

    // PUT /updateTipoAcondicionamiento/{id} — Actualizar tipo.
    Route::put('/updateTipoAcondicionamiento/{id}', 'updateTipoAcondicionamiento');

    // DELETE /deleteTipoAcondicionamiento/{id} — Eliminar tipo.
    Route::delete('/deleteTipoAcondicionamiento/{id}', 'deleteTipoAcondicionamiento');
});

/**
 * ==============================================
 *   LÍNEAS X TIPO DE ACONDIC. (Relación/Mapping)
 * ==============================================
 */
Route::controller(LineaTipoAcondicionamientoController::class)->group(function () {
    // GET /getLineaTipoAcondicionamiento — Listar relaciones línea–tipo.
    Route::get('/getLineaTipoAcondicionamiento', 'getAll');

    // POST /newLineaTipoAcondicionamiento — Crear relación.
    Route::post('/newLineaTipoAcondicionamiento', 'store');

    // PUT /updateLineaTipoAcondicionamiento/{id} — Actualizar relación.
    Route::put('/updateLineaTipoAcondicionamiento/{id}', 'update');

    // DELETE /deleteLineaTipoAcondicionamiento/{id} — Eliminar relación.
    Route::delete('/deleteLineaTipoAcondicionamiento/{id}', 'destroy');

    // GET /getLineaTipoAcondicionamiento/{id} — Listar relaciones por id de tipo.
    Route::get('/getLineaTipoAcondicionamiento/{id}', 'getByTipoAcondicionamiento');

    // GET /getListTipoyLineas/{id} — Obtener lista combinada (tipo y líneas) por id de tipo.
    Route::get('/getListTipoyLineas/{id}', 'getListTipoyLineas');

    // GET /getSelectStages — Opciones de etapas para selects (catálogo).
    Route::get('/getSelectStages', 'getSelectStages');
});

/**
 * ============================
 *    ÓRDENES EJECUTADAS
 * ============================
 * Flujo de ejecución: validación, generación, avance de fases, formularios y conciliación.
 */
Route::controller(OrdenesEjecutadasController::class)->group(function () {
    // GET /validar_estado/{id} — Validar estado de una orden por id.
    Route::get('/validar_estado/{id}', 'validar_estado');

    // GET /generar_orden/{id} — Generar orden ejecutada a partir de plan/solicitud.
    Route::get('/generar_orden/{id}', 'generar_orden');

    // GET /linea_procesos/{id} — Listar procesos para línea (por id de línea o de orden, según controller).
    Route::get('/linea_procesos/{id}', 'linea_procesos');

    // GET /siguiente_fase/{id}/{linea}/{tipo} — Calcular/obtener siguiente fase.
    Route::get('/siguiente_fase/{id}/{linea}/{tipo}', 'siguiente_fase');

    // POST /guardar_actividades — Guardar formulario de actividades ejecutadas.
    Route::post('/guardar_actividades', 'guardar_formulario');

    // GET /getFaseControl/{id} — Obtener controles de fase por id.
    Route::get('/getFaseControl/{id}', 'getFaseControl');

    // GET /getActividadesControl/{id} — Obtener actividades de control por id.
    Route::get('/getActividadesControl/{id}', 'getActividadesControl');

    // GET /validate_rol/{fase} — Validar rol requerido para fase.
    Route::get('/validate_rol/{fase}', 'validateRol');

    // GET /condiciones_fase/{id}/{fase} — Validar condiciones de fase para orden/fase.
    Route::get('/condiciones_fase/{id}/{fase}', 'condicionesFase');

    // GET /getActividadesEjecutadas/{id} — Listar actividades ya ejecutadas (por orden/fase).
    Route::get('/getActividadesEjecutadas/{id}', 'getActividadesEjecutadas');

    // GET /eliminar_orden/{id} — Eliminar registro de orden ejecutada.
    Route::get('/eliminar_orden/{id}', 'eliminar_orden');

    // GET /getConciliacion/{id} — Obtener conciliación por id de orden/plan.
    Route::get('/getConciliacion/{id}', 'getConciliacion');

    // POST /guardar_conciliacion — Guardar conciliación (payload con totales/observaciones).
    Route::post('/guardar_conciliacion', 'guardar_conciliacion');

    // GET /restablecer_orden/{id} — Restablecer/rollback de orden a estado anterior.
    Route::get('/restablecer_orden/{id}', 'restablecerOrden');

    // POST /guardar_actividades_control — Guardar actividades de control (formulario).
    Route::post('/guardar_actividades_control', 'guardar_actividades_control');

    // GET /getActividadesTestigo/{id} — Obtener actividades testigo por id.
    Route::get('/getActividadesTestigo/{id}', 'getActividadesTestigo');

    // POST /guardar_actividades_testigos — Guardar actividades testigo.
    Route::post('/guardar_actividades_testigos', 'guardar_actividades_testigos');

    // GET /relacionarOrden/{id} — Relacionar orden ejecutada con otra entidad/orden.
    Route::get('/relacionarOrden/{id}', 'relacionarOrden');

    // GET /validate_conciliacion/{id} — Validar si la conciliación está lista/consistente.
    Route::get('/validate_conciliacion/{id}', 'validateConciliacion');
});

/**
 * ============================
 *        HISTORIAL (AUDIT)
 * ============================
 * Consultas de auditoría por modelo/ámbito.
 */
Route::controller(HistoryAuditController::class)->group(function () {
    // GET /getAudit — Listar logs de auditoría (general).
    Route::get('/getAudit', 'index');

    // GET /getAuditAdaptation — Auditoría enfocada en Acondicionamientos.
    Route::get('/getAuditAdaptation', 'indexAdaptation');

    // GET /getAuditAdmin — Auditoría para admins (scope ampliado).
    Route::get('/getAuditAdmin', 'indexAdmin');

    // GET /{model}/{id} — Auditoría por modelo e id (ruta genérica).
    Route::get('/{model}/{id}', 'byModel');

    // GET /audit/{model}/{id} — Auditoría por modelo para Acondicionamientos.
    Route::get('/audit/{model}/{id}', 'byModelAdaptation');

    // GET /audit/admin/{model}/{id} — Auditoría por modelo en ámbito admin.
    Route::get('/audit/admin/{model}/{id}', 'byModelAdmin');
});

/**
 * ============================
 *            TIMERS
 * ============================
 * Manejo de timers por orden/fase: crear, pausar, finalizar, reiniciar.
 */
Route::controller(TimerController::class)->group(function () {
    // GET /getTimer — Listar timers.
    Route::get('/getTimer', 'index');

    // POST /newTimer — Crear timer.
    Route::post('/newTimer', 'store');

    // GET /getTimer/{id} — Detalle de timer por id.
    Route::get('/getTimer/{id}', 'show');

    // GET /timers/by-ejecutada/{ejecutada_id} — Timers por id de orden ejecutada.
    Route::get('/timers/by-ejecutada/{ejecutada_id}', 'getEjecutadaId');

    // PATCH /timers/pause — Pausar timer (payload con timer_id).
    Route::patch('/timers/pause', 'pause');

    // PATCH /timers/finish — Finalizar timer (payload con timer_id).
    Route::patch('/timers/finish', 'finish');

    // PATCH /timers/resetTimer — Reiniciar timer (payload con timer_id).
    Route::patch('/timers/resetTimer', 'reset');
});

/**
 * ============================
 *        TIMER CONTROL
 * ============================
 * Registro de controles de timer (eventos/acciones).
 */
Route::controller(TimerControlController::class)->group(function () {
    // POST /newTcontrol — Crear registro de control de timer.
    Route::post('/newTcontrol', 'store');
});


/**
 * ============================
 *         FASE TIMER
 * ============================
 * Consultas de timers por fase/control.
 */
Route::controller(FaseTimerController::class)->group(function () {
    // GET /getFaseTimer — Listar FaseTimer (asociaciones/config).
    Route::get('/getFaseTimer', 'getAll');

    // GET /getFaseTimer/control/{id} — Obtener FaseTimer por id de control.
    Route::get('/getFaseTimer/control/{id}', 'getFaseTimerControl');
});
