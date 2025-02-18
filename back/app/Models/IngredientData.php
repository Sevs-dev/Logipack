<?php

namespace App\Models;


class IngredientData 
{
    public $nombre;
    public $proveedor;
    public $serial;
    public $comercializador;
    public $composicion;
    public $medidas;
    public $origen;
    public $tipo;
    public $pureza;
    public $concentracion;
    public $vida_util;
    public $categoria;
    public $riesgo;
    public $temperatura_almacenamiento;
    public $date_status;

    public function __construct($data)
    {
        $this->nombre = $data['nombre'];
        $this->proveedor = $data['proveedor'];
        $this->serial = $data['serial'];
        $this->comercializador = $data['comercializador'];
        $this->composicion = $data['composicion'];
        $this->medidas = $data['medidas'];
        $this->origen = $data['origen'];
        $this->tipo = $data['tipo'];
        $this->pureza = $data['pureza'];
        $this->concentracion = $data['concentracion'];
        $this->vida_util = $data['vida_util'];
        $this->categoria = $data['categoria'];
        $this->riesgo = $data['riesgo'];
        $this->temperatura_almacenamiento = $data['temperatura_almacenamiento'];
        $this->date_status = $data['date_status'];
    }

    public function toArray()
    {
        return [
            'nombre' => $this->nombre,
            'proveedor' => $this->proveedor,
            'serial' => $this->serial,
            'comercializador' => $this->comercializador,
            'composicion' => $this->composicion,
            'medidas' => $this->medidas,
            'origen' => $this->origen,
            'tipo' => $this->tipo,
            'pureza' => $this->pureza,
            'concentracion' => $this->concentracion,
            'vida_util' => $this->vida_util,
            'categoria' => $this->categoria,
            'riesgo' => $this->riesgo,
            'temperatura_almacenamiento' => $this->temperatura_almacenamiento,
            'date_status' => $this->date_status,
        ];
    }
}
