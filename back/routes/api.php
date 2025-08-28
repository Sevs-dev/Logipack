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

Route::controller(AuthController::class)->group(function () {
    Route::post('login', 'login');
    Route::post('register', 'register');
    Route::post('logout', 'logout');
    Route::post('refresh', 'refresh');
    Route::get('/user/{email}', 'getUserByEmail');
    Route::post('/edit-image/{email}', 'EditImage');
    Route::post('/users/upload-image',  'uploadUserImage');

    Route::post('/users', 'create');
    Route::get('/role', 'role');
    Route::get('/usersAll', 'getUsers');
    Route::delete('/delete/{id}', 'getUserDelete');
    Route::put('/update/{id}', 'getUserUpdate');
    Route::get('/date/{id}', 'getuserById');
    Route::post('/users/validate-security-pass', 'validateSecurityPassByRole');
});

//Rutas Permissions
Route::controller(PermissionController::class)->group(function () {
    Route::post('/newPermission', 'createPermission');
    Route::get('/permissions', 'getPermisos');
    Route::post('/permissionsUpdate', 'updateRolePermissions');
    Route::get('/role-permissions/{roleName}', 'getPermissionsByRoleName');
    Route::delete('/deletePermission/{id}', 'deletePermission'); // Eliminar una lineas
    Route::get('/PermissionId/{id}', 'permissionId'); // Obtener una fábrica específica
    Route::put('/updatePermission/{id}', 'updatePermission'); // Actualizar una fábrica
});

//Rutas Roles
Route::controller(RolesController::class)->group(function () {
    Route::get('/getRole', 'getRole'); // Obtener todas las lineas
    Route::post('/newRole', 'newRole'); // Crear una nueva lineas
    Route::get('/RoleId/{id}', 'RoleId'); // Obtener una lineas específica
    Route::put('/updateRole/{id}', 'updateRole'); // Actualizar una lineas
    Route::delete('/deleteRole/{id}', 'deleteRole'); // Eliminar una lineas
});

//Rutas Factories
Route::controller(FactoryController::class)->group(function () {
    Route::get('/getFactories', 'getFactories'); // Obtener todas las fábricas
    Route::post('/newFactory', 'newFactory'); // Crear una nueva fábrica
    Route::get('/factoryId/{id}', 'factoryId'); // Obtener una fábrica específica
    Route::put('/updateFactory/{id}', 'updateFactory'); // Actualizar una fábrica
    Route::delete('/deleteFactory/{id}', 'deleteFactory'); // Eliminar una fábrica
});
//Rutas Lineas
Route::controller(ManufacturingController::class)->group(function () {
    Route::get('/getManu', 'getManu'); // Obtener todas las lineas
    Route::post('/newManu', 'newManu'); // Crear una nueva lineas
    Route::get('/ManuId/{id}', 'ManuId'); // Obtener una lineas específica
    Route::put('/updateManu/{id}', 'updateManu'); // Actualizar una lineas
    Route::delete('/deleteManu/{id}', 'deleteManu'); // Eliminar una lineas
});

//Rutas Maquinaria
Route::controller(MachineryController::class)->group(function () {
    Route::get('/getMachin', 'getMachin'); // Obtener todas las lineas
    Route::post('/newMachin', 'newMachin'); // Crear una nueva lineas
    Route::get('/MachinId/{id}', 'MachinId'); // Obtener una lineas específica
    Route::put('/updateMachin/{id}', 'updateMachin'); // Actualizar una lineas
    Route::delete('/deleteMachin/{id}', 'deleteMachin'); // Eliminar una lineas
});

//Rutas Clientes
Route::controller(ClientsController::class)->group(function () {
    Route::get('/clients/sync', 'getClientDataApi');
    Route::get('/getClients', 'getClients'); // Obtener todas las lineas
    Route::post('/newClients', 'newClients'); // Crear una nueva lineas
    Route::get('/ClientsId/{id}', 'ClientsId'); // Obtener una lineas específica
    Route::put('/updateClients/{id}', 'updateClients'); // Actualizar una lineas
    Route::delete('/deleteClients/{id}', 'deleteClients'); // Eliminar una lineas
});

//Rutas Productos
Route::controller(ProductController::class)->group(function () {
    Route::get('/getProduct', 'getProduct'); // Obtener todas las lineas
    Route::post('/newProduct', 'newProduct'); // Crear una nueva lineas
    Route::get('/ProductId/{id}', 'ProductId'); // Obtener una lineas específica
    Route::get('/ProductName/{name}', 'ProductName'); // Obtener una lineas específica
    Route::put('/updateProduct/{id}', 'updateProduct'); // Actualizar una lineas
    Route::delete('/deleteProduct/{id}', 'deleteProduct'); // Eliminar una lineas
});

//Rutas Maestras
Route::controller(MaestrasController::class)->group(function () {
    Route::get('/getMaestra', 'getMaestra'); // Obtener todas las lineas
    Route::get('/getMuestreo/{id}', 'getMuestreo'); // Obtener todas las lineas
    Route::post('/newMaestra', 'newMaestra'); // Crear una nueva lineas
    Route::get('/MaestraId/{id}', 'MaestraId'); // Obtener una lineas específica
    Route::get('/MaestraName/{name}', 'MaestraName'); // Obtener una lineas específica
    Route::put('/updateMaestra/{id}', 'updateMaestra'); // Actualizar una lineas
    Route::delete('/deleteMaestra/{id}', 'deleteMaestra'); // Eliminar una lineas
    Route::get('/getTipo', 'obtenerTipos');
});

//Rutas Fases
Route::controller(StagesController::class)->group(function () {
    Route::get('/getFase', 'getFase'); // Obtener todas las lineas
    Route::post('/newFase', 'newFase'); // Crear una nueva lineas
    Route::get('/FaseId/{id}', 'FaseId'); // Obtener una lineas específica
    Route::get('/controlStages/{id}', 'controlStages'); // Obtener una lineas específica
    Route::get('/FaseName/{name}', 'FaseName'); // Obtener una lineas específica
    Route::put('/updateFase/{id}', 'updateFase'); // Actualizar una lineas
    Route::delete('/deleteFase/{id}', 'deleteFase'); // Eliminar una lineas
});

//Rutas Actividades
Route::controller(ActivitiesController::class)->group(function () {
    Route::get('/getActividad', 'getActividad'); // Obtener todas las lineas
    Route::post('/newActividad', 'newActividad'); // Crear una nueva lineas
    Route::get('/ActividadId/{id}', 'ActividadId'); // Obtener una lineas específica 
    Route::put('/updateActividad/{id}', 'updateActividad'); // Actualizar una lineas
    Route::delete('/deleteActividad/{id}', 'deleteActividad'); // Eliminar una lineas
});

//Rutas Articulos
Route::controller(ArticlesController::class)->group(function () {
    Route::get('/getArticle', 'getArticle'); // Obtener todas las lineas
    Route::get('/getBom', 'getAllBoms'); // Obtener todas las lineas
    Route::post('/newArticle', 'newArticle'); // Crear una nueva lineas
    Route::get('/getCode/{code}', 'getArticlesByCoddiv'); // Obtener una lineas específica 
    Route::get('/getArticleId/{id}', 'getArticleById'); // Obtener una lineas específica 
    Route::get('/getArticleByClientId/{id}', 'getArticleByClientId'); // Obtener una lineas específica 
    Route::put('/updateArticle/{id}', 'updateArticle'); // Actualizar una lineas
    Route::delete('/deleteArticle/{id}', 'deleteArticle'); // Eliminar una lineas
});

//Rutas Acondicionamiento
Route::controller(AdaptationController::class)->group(function () {
    Route::get('/getAdaptation', 'getAdaptation'); // Obtener todas las lineas 
    Route::post('/newAdaptation', 'newAdaptation'); // Crear una nueva lineas 
    Route::post('/newAttachment', 'uploadAttachment'); // Crear una nueva lineas 
    Route::get('/getAdaptationId/{id}', 'getAdaptationById'); // Obtener una lineas específica 
    Route::put('/updateAdaptation/{id}', 'updateAdaptation'); // Actualizar una lineas
    Route::delete('/deleteAdaptation/{id}', 'deleteAdaptation'); // Eliminar una lineas
    Route::get('/debug/adaptation/{id}', 'debugBomAndIngredients'); // Obtener una lineas específica 
});

//Rutas Planificación
Route::controller(AdaptationDateController::class)->group(function () {
    Route::get('/getPlan', 'getPlan'); // Obtener todas las lineas 
    Route::get('/getPlanDash', 'getPlanDash'); // Obtener todas las lineas 
    Route::post('/newPlan', 'newAPlan'); // Crear una nueva lineas 
    Route::put('/updatePlan/{id}', 'update'); // Crear una nueva lineas 
    Route::get('/getPlanId/{id}', 'getPlanById'); // Obtener una lineas específica  
    Route::get('/getPlannId/{id}', 'getPlanUnic'); // Obtener una lineas específica  
    Route::get('/getPlanByIdPDF/{id}', 'getPlanByIdPDF'); // Obtener una lineas específica  
    Route::get('/pdf/plan/{id}', 'generatePDFView'); // Obtener una lineas específica  
    Route::get('/consult-planning', 'getConsultPlanning'); // Obtener una lineas específica  
    Route::delete('/deletePlan/{id}', 'destroy'); // Eliminar una lineas
});

//Rutas consecutivo
Route::controller(ConsecutiveController::class)->group(function () {
    Route::get('/getConsecutive', 'getAll');
    Route::get('/getConsecutiveDate', 'getAllConsecutiveDates');
    Route::get('/getPrefix/{prefix}', 'getPrefix');
    Route::put('/updateConsecutive/{id}', 'update');
});

//Rutas Tipo de Acondicionamiento
Route::controller(TipoAcondicionamientoController::class)->group(function () {
    Route::get('/getTipoAcondicionamiento', 'getAll'); // Obtener todas las lineas   
    Route::get('/getTipoAcondicionamientoId/{id}', 'getTipoAcondicionamiento'); // Obtener una lineas específica
    Route::post('/newTipoAcondicionamiento', 'newTipoAcondicionamiento'); // Crear una nueva lineas 
    Route::put('/updateTipoAcondicionamiento/{id}', 'updateTipoAcondicionamiento'); // Actualizar una lineas
    Route::delete('/deleteTipoAcondicionamiento/{id}', 'deleteTipoAcondicionamiento'); // Eliminar una lineas
});

//Rutas Lineas Tipo de Acondicionamiento
Route::controller(LineaTipoAcondicionamientoController::class)->group(function () {
    Route::get('/getLineaTipoAcondicionamiento', 'getAll'); // Obtener todas las lineas   
    Route::post('/newLineaTipoAcondicionamiento', 'store'); // Crear una nueva lineas 
    Route::put('/updateLineaTipoAcondicionamiento/{id}', 'update'); // Actualizar una lineas
    Route::delete('/deleteLineaTipoAcondicionamiento/{id}', 'destroy'); // Eliminar una lineas
    Route::get('/getLineaTipoAcondicionamiento/{id}', 'getByTipoAcondicionamiento'); // Obtener una lineas específica
    Route::get('/getListTipoyLineas/{id}', 'getListTipoyLineas'); // Obtener una lineas específica
    Route::get('/getSelectStages', 'getSelectStages'); // Obtener una lineas específica
});

//Rutas Ordenes Ejecutadas
Route::controller(OrdenesEjecutadasController::class)->group(function () {
    Route::get('/validar_estado/{id}', 'validar_estado'); // Crear una nueva lineas 
    Route::get('/generar_orden/{id}', 'generar_orden'); // Crear una nueva lineas 
    Route::get('/linea_procesos/{id}', 'linea_procesos'); // Listar linea procesos
    Route::get('/siguiente_fase/{id}/{linea}/{tipo}', 'siguiente_fase'); // Listar linea procesos
    Route::post('/guardar_actividades', 'guardar_formulario');
    Route::get('/getFaseControl/{id}', 'getFaseControl');
    Route::get('/getActividadesControl/{id}', 'getActividadesControl');
    Route::get('/validate_rol/{fase}', 'validateRol');
    Route::get('/condiciones_fase/{id}/{fase}', 'condicionesFase');
    Route::get('/getActividadesEjecutadas/{id}', 'getActividadesEjecutadas');
    Route::get('/eliminar_orden/{id}', 'eliminar_orden');
    Route::get('/getConciliacion/{id}', 'getConciliacion');
    Route::post('/guardar_conciliacion', 'guardar_conciliacion');
    Route::get('/restablecer_orden/{id}', 'restablecerOrden');
    Route::post('/guardar_actividades_control', 'guardar_actividades_control');
    Route::get('/getActividadesTestigo/{id}', 'getActividadesTestigo');
    Route::post('/guardar_actividades_testigos', 'guardar_actividades_testigos');
    Route::get('/relacionarOrden/{id}', 'relacionarOrden');
    
});

//Rutas Historial de Audits
Route::controller(HistoryAuditController::class)->group(function () {
    Route::get('/getAudit', 'index'); // Obtener todas las lineas   
    Route::get('/getAuditAdaptation', 'indexAdaptation'); // Obtener todas las lineas   
    Route::get('/getAuditAdmin', 'indexAdmin'); // Obtener todas las lineas   
    Route::get('/{model}/{id}', 'byModel'); // Obtener una lineas específica
    Route::get('/audit/{model}/{id}', 'byModelAdaptation'); // Obtener una lineas específica
    Route::get('/audit/admin/{model}/{id}', 'byModelAdmin'); // Obtener una lineas específica
});

//Rutas Timer
Route::controller(TimerController::class)->group(function () {
    Route::get('/getTimer', 'index');                         // Listar timers
    Route::post('/newTimer', 'store');                        // Crear timer
    Route::get('/getTimer/{id}', 'show');                     // Obtener uno
    Route::get('/timers/by-ejecutada/{ejecutada_id}', 'getEjecutadaId'); // Obtener por ejecutada_id

    Route::patch('/timers/pause', 'pause');                     // Pausar
    Route::patch('/timers/finish', 'finish');                   // Finalizar
    Route::patch('/timers/resetTimer', 'reset');                     // Reiniciar
});

//Rutas FaseTimer
Route::controller(FaseTimerController::class)->group(function () {
    Route::get('/getFaseTimer', 'getAll');                         // Listar timers
    Route::get('/getFaseTimer/control/{id}', 'getFaseTimerControl');   // Listar timers por id
});

//Rutas Timer Control
Route::controller(TimerControlController::class)->group(function () {
    Route::post('/newTcontrol', 'store');    
});