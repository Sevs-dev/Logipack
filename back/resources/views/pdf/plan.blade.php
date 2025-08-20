<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <title>Batch Record - Orden {{ $plan->number_order }}</title>
    <style>
        @page {
            margin: 72px;
        }

        body {
            font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            font-size: 12px;
            background-color: #ffffff;
            padding: 0;
            line-height: 1.6;
            margin: 0;
            position: relative;
        }

        .content {
            position: relative;
            z-index: 1;
            max-width: 100%;
        }

        h1 {
            text-align: center;
            font-size: 20px;
            font-weight: 600;
            color: #1e3a8a;
            margin: 0 0 16px 0;
            letter-spacing: -0.5px;
        }

        h2 {
            font-size: 15px;
            font-weight: 600;
            color: #000000;
            text-align: center;
            margin: 32px 0 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #dbeafe;
        }

        h3 {
            font-size: 13px;
            font-weight: 600;
            color: #1e40af;
            margin: 24px 0 8px;
        }

        /* === Tablas === */
        .table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0 24px;
            font-size: 11.5px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            table-layout: auto;

            page-break-inside: auto;
            /* <- NUEVO */
            break-inside: auto;
            /* <- NUEVO */
        }

        .table th,
        .table td {
            padding: 6px 8px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: middle;
            word-break: break-word;
            white-space: normal;
            overflow-wrap: break-word;
        }

        .table th {
            background-color: #eff6ff;
            color: #0026a1;
            font-weight: 600;
            font-size: 11px;
            text-align: center;
        }

        .table td {
            background-color: #ffffff;
            color: #374151;
            font-size: 11px;
            text-align: center;
        }

        .table tr:nth-child(even) td {
            background-color: #f9fafb;
        }

        .table tr:last-child td {
            border-bottom: none;
        }

        .table-centered th,
        .table-centered td {
            text-align: center;
        }

        .table td.nowrap {
            white-space: nowrap;
        }

        .table td.right {
            text-align: right;
        }

        /* Stripe y hover */
        .table-striped tbody tr:nth-child(odd) td {
            background-color: #fff;
        }

        .table-striped tbody tr:hover td {
            background-color: #fff;
            transition: background-color 0.2s ease;
        }

        /* 🔥 NUEVO: evitar que una fila se parta entre páginas */
        .table tr {
            page-break-inside: avoid;
            break-inside: avoid;
        }

        /* 🔥 NUEVO: repetir encabezado si se parte */
        thead {
            display: table-header-group;
        }

        /* Listas */
        ul {
            padding-left: 18px;
            margin: 10px 0;
            list-style-type: square;
        }

        ul li {
            color: #4b5563;
            margin-bottom: 4px;
            font-size: 11.5px;
        }

        /* Imágenes en celdas */
        .evidence-img {
            max-width: 210px;
            max-height: 110px;
            object-fit: contain;
            border-radius: 4px;
            border: 1px solid #d1d5db;
        }

        /* Footer */
        footer {
            margin-top: 48px;
            font-size: 10px;
            text-align: center;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
        }

        /* Marca de agua */
        .watermark {
            position: fixed;
            top: 50%;
            left: 40%;
            transform: translate(-50%, -50%) rotate(-30deg);
            transform-origin: center center;
            opacity: 0.08;
            pointer-events: none;
            z-index: 999;
            width: 680px;
            filter: grayscale(100%);
        }

        /* Celdas con datos especiales */
        .data-label {
            font-weight: 500;
            color: #4b5563;
        }

        /* Diagrama tipo snake */
        .timeline-horizontal {
            display: table;
            width: 100%;
            table-layout: fixed;
            border-collapse: separate;
            border-spacing: 6px 0;
            page-break-inside: avoid;
            margin: 24px 0;
        }

        .timeline-step {
            display: table-cell;
            text-align: center;
            vertical-align: top;
            padding: 0;
            position: relative;
        }

        .timeline-label {
            font-size: 10px;
            color: #1e3a8a;
            background: #ffffff;
            padding: 0 6px;
            border-radius: 6px;
            border: 1px solid #c7d2fe;
            box-shadow: 0 1px 1px rgba(0, 0, 0, 0.04);
            min-width: 80px;
            max-width: 100px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            vertical-align: middle;
            word-break: break-word;
            white-space: normal;
            margin: auto;
            line-height: 1.2;
        }

        .timeline-circle {
            background: #eff6ff;
            border: 1.5px solid #3b82f6;
            color: #1e40af;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            font-weight: bold;
            font-size: 10px;
            text-align: center;
            line-height: 20px;
            margin: auto;
        }

        .timeline-arrow {
            display: table-cell;
            text-align: center;
            vertical-align: middle;
            width: 16px;
            font-size: 14px;
            color: #6b7280;
            line-height: 1;
        }
    </style>
</head>

<body>

    {{-- ✅ Marca de agua --}}
    @php
        $path = public_path('images/logo.png');
        $type = pathinfo($path, PATHINFO_EXTENSION);
        $data = file_get_contents($path);
        $base64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
    @endphp
    <img src="{{ $base64 }}" alt="Marca de agua Pharex" class="watermark">

    <div class="content">
        <div
            style="position: relative; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
            <img src="{{ $base64 }}" alt="Logo" style="position: absolute; left: 0; height: 40px;">
            <h1 style="margin: 0; flex-grow: 1; text-align: center;">Batch Record de Producción</h1>
        </div>

        <h2>Datos Generales</h2>
        <table class="table">
            <tr>
                <th style="width: 15%">Orden</th>
                <td style="width: 35%">{{ $plan->number_order }}</td>
                <th style="width: 15%">Cliente</th>
                <td style="width: 35%">{{ $cliente->name ?? '—' }}</td>
            </tr>
        </table>

        <h2>Producto a Obtener</h2>

        <table class="table">
            <tr>
                <th>Código Artículo</th>
                <td>{{ $plan->codart }}</td>
                <th>Producto</th>
                <td>{{ $desart ?? 'No contiene Nombre' }}</td>
            </tr>
            <tr>
                <th>Lote</th>
                <td>{{ $plan->lot ?? '—' }}</td>
                <th>Vence</th>
                <td>{{ \Carbon\Carbon::parse($plan->end_date)->format('Y-m-d') ?? '—' }}</td>
            </tr>
            <tr>
                <th>Cantidad</th>
                <td>{{ $plan->quantityToProduce }} unidades</td>
                <th></th>
                <td></td>
            </tr>
        </table>

        {{-- ===== Diagrama de Operaciones (3 por fila, color único + flecha " ---> ") ===== --}}
        <h2 class="snake-heading">Diagrama de Operaciones</h2>
        @php
            $stagesArr = collect($stages ?? [])
                ->values()
                ->map(function ($s, $i) {
                    $label = $s->description ?? 'Etapa ' . $s->id;
                    $label = trim(strip_tags((string) $label));
                    return [
                        'id' => $s->id,
                        'label' => $label ?: 'Etapa ' . ($s->id ?? '?'),
                        'seq' => $i + 1,
                    ];
                })
                ->toArray();

            // 3 por fila: 1-2-3 / 4-5-6 / ...
            $rows = array_chunk($stagesArr, 3);
        @endphp

        @if (count($rows))
            <style>
                /* ====== Estilos seguros para DOMPDF (sin flex, sin grid) ====== */

                .snake-heading {
                    text-align: center;
                    font-weight: 700;
                    margin: 8px 0 12px;
                    color: #111827;
                }

                .snake-wrap {
                    width: 100%;
                }

                .snake-row {
                    width: 100%;
                    margin-bottom: 10px;
                    font-size: 0;
                    /* evita espacios entre inline-blocks */
                    page-break-inside: avoid;
                    text-align: center;
                    /* centra el conjunto si hay menos de 3 celdas */
                }

                /* 31% + 3.5% + 31% + 3.5% + 31% = 100% */
                .snake-cell,
                .snake-conn {
                    display: inline-block;
                    vertical-align: top;
                    page-break-inside: avoid;
                }

                .snake-cell {
                    width: 31%;
                    text-align: center;
                    /* centra el contenido dentro de la tarjeta */
                }

                .snake-conn {
                    width: 3.5%;
                    text-align: center;
                }

                /* Tarjeta (mismo color para todos) */
                .snake-card {
                    border: 1px solid #e5e7eb;
                    border-left: 4px solid #3b82f6;
                    /* azul único */
                    border-radius: 8px;
                    padding: 8px;
                    background: #fff;
                    font-size: 12px;
                    line-height: 1.35;
                    min-height: 56px;
                    display: inline-block;
                    /* ayuda a centrar y a evitar estiramientos raros */
                }

                .snake-label {
                    font-size: 11.5px;
                    color: #111827;
                    margin-bottom: 6px;
                    font-weight: 600;
                    text-align: center;
                    white-space: normal;
                }

                /* Badge numerado (mismo color) */
                .snake-badge {
                    display: inline-block;
                    min-width: 26px;
                    height: 26px;
                    line-height: 26px;
                    text-align: center;
                    border-radius: 50%;
                    border: 1px solid #93c5fd;
                    /* azul claro */
                    background: #eff6ff;
                    /* azul muy claro */
                    color: #1e3a8a;
                    /* azul oscuro */
                    font-weight: 700;
                    font-size: 11px;
                    vertical-align: middle;
                }

                /* Título/etiqueta al lado del badge, centrado y alineado */
                .snake-title {
                    display: inline-block;
                    margin-left: 6px;
                    vertical-align: middle;
                    font-size: 11.5px;
                }

                .snake-meta {
                    font-size: 11px;
                    color: #374151;
                    margin-top: 4px;
                    text-align: center;
                }

                .snake-meta small {
                    color: #6b7280;
                }

                /* Conector: línea + flecha ---> */
                .conn-line {
                    border-top: 1px dashed #94a3b8;
                    margin-top: 18px;
                }

                .conn-arrow {
                    font-size: 12px;
                    color: #1e3a8a;
                    /* mismo azul */
                    line-height: 1;
                    margin-top: 4px;
                    white-space: nowrap;
                    font-family: ui-monospace, Menlo, Consolas, monospace;
                }

                /* Utilidades */
                .avoid-break {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
            </style>

            <div class="snake-wrap">
                @foreach ($rows as $rowIndex => $row)
                    <div class="snake-row">
                        @foreach ($row as $idx => $stage)
                            <div class="snake-cell">
                                <div class="snake-card">
                                    <div class="snake-label">
                                        <span class="snake-badge">{{ $stage['seq'] }}</span>
                                        <span class="snake-title">{{ $stage['label'] }}</span>
                                    </div>

                                    {{-- Si quieres meta extra, déjala centrada aquí --}}
                                    {{-- <div class="snake-meta"><small>ID:</small> {{ $stage['id'] }}</div> --}}
                                </div>
                            </div>

                            {{-- Conector horizontal " ---> " (no después del último) --}}
                            @if ($idx < count($row) - 1)
                                <div class="snake-conn avoid-break">
                                    <div class="conn-line"></div>
                                    <div class="conn-arrow"> --&gt; </div>
                                </div>
                            @endif
                        @endforeach
                    </div>
                @endforeach
            </div>
        @endif
        {{-- ===== Fin Diagrama ===== --}}

        <table class="table">
            <tr>
                <th style="width: 10%">Receta validada por</th>
                <td style="width: 35%">
                    {{ $plan->user ? urldecode(preg_replace('/[\r\n]+/', '', $plan->user)) : 'Sin usuario' }}
                </td>
                <th style="width: 15%">Cliente</th>
                <td style="width: 15%">{{ $cliente->updated_at ?? '—' }}</td>
            </tr>
        </table>

        <h2>Operaciones Ejecutadas</h2>
        @foreach ($actividadesEjecutadas as $index => $actividad)
            @if (!empty($actividad['forms']))
                <h3>{{ $index + 1 }}. {{ $actividad['description_fase'] }}</h3>
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th style="width: 30%">Actividad</th>
                            <th style="width: 25%">Resultado</th>
                            <th style="width: 15%">Línea</th>
                            <th style="width: 15%">Usuario</th>
                            <th style="width: 15%">Hora</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($actividad['forms'] as $form)
                            <tr>
                                <td>{{ $form['descripcion_activitie'] ?? '—' }}</td>
                                <td>
                                    @if (isset($form['valor']) && is_string($form['valor']) && str_starts_with($form['valor'], 'data:image'))
                                        <img src="{{ $form['valor'] }}" alt="Evidencia" class="evidence-img">
                                    @elseif(is_string($form['valor']))
                                        <span class="data-label">{{ $form['valor'] }}</span>
                                    @elseif(is_array($form['valor']))
                                        <span class="data-label">
                                            @foreach ($form['valor'] as $val)
                                                • {{ $val }}<br>
                                            @endforeach
                                        </span>
                                    @else
                                        <span class="data-label">—</span>
                                    @endif
                                </td>
                                <td>{{ $form['linea'] ?? '—' }}</td>
                                <td>{{ isset($actividad['user']) ? urldecode($actividad['user']) : '—' }}</td>
                                <td>{{ \Carbon\Carbon::parse($actividad['created_at'])->format('H:i') }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        @endforeach

        {{-- ===== Resumen de Conciliación ===== --}}

        @php
            // Normaliza conciliación: si es array => objeto, si no existe => null
            $cRaw = $conciliacion ?? null;
            $c = is_array($cRaw) ? (object) $cRaw : $cRaw;

            // Helpers seguros
            $nf = fn($v) => $v === null || $v === '' ? '—' : number_format((float) $v, 2, ',', '.');
            $pf = fn($v) => $v === null || $v === '' ? '—' : $nf($v) . '%';
            $val = fn($key, $default = null) => data_get($c, $key, $default); // seguro p/ null/array/obj

            // Desvíos presentes
            $desvMap = [
                'faltante' => 'Faltante',
                'adicionales' => 'Adicionales',
                'rechazo' => 'Rechazo',
                'danno_proceso' => 'Daño Proceso',
                'devolucion' => 'Devolución',
                'sobrante' => 'Sobrante',
            ];
            $desvPresentes = [];
            if ($c) {
                foreach ($desvMap as $key => $label) {
                    $v = (float) $val($key, 0);
                    if ($v != 0.0) {
                        $desvPresentes[$key] = $label;
                    }
                }
            }

            // Rendimiento y clase (NO accedas $c->... directo)
            $rend = (float) $val('rendimiento', 0);
            $rendClass = $rend >= 99.5 ? 'conc-badge-ok' : ($rend >= 98.0 ? 'conc-badge-mid' : 'conc-badge-warn');

            // Fecha segura
            $fechaConc = $val('updated_at') ? \Carbon\Carbon::parse($val('updated_at'))->format('Y-m-d H:i') : '—';

            // ¿Hay conciliación “real”? (no solo objeto vacío)
            $hasConc = $c && collect((array) $c)->filter(fn($v) => $v !== null && $v !== '')->isNotEmpty();
        @endphp

        @if ($hasConc)
            <h2>Resumen de Conciliación</h2>

            <style>
                /* ===== Estilos seguros para DOMPDF ===== */
                .conc-wrap {
                    width: 100%;
                }

                .conc-row {
                    width: 100%;
                }

                .conc-col {
                    display: inline-block;
                    vertical-align: top;
                    width: 49%;
                    margin: 0 1% 0 0;
                }

                .conc-col:last-child {
                    margin-right: 0;
                }

                .conc-card {
                    background: #fff;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 10px;
                    page-break-inside: avoid;
                }

                .conc-title {
                    margin: 0 0 6px 0;
                    font-size: 12px;
                    color: #1e40af;
                    font-weight: 700;
                }

                .conc-kpi {
                    font-size: 12.75px;
                    color: #111827;
                    line-height: 1.45;
                }

                .conc-kpi small {
                    color: #6b7280;
                    font-weight: 500;
                }

                .conc-rowflex {
                    display: block;
                }

                /* evitar flex real en dompdf */
                .conc-strong {
                    font-weight: 600;
                }

                .conc-list {
                    margin: 0;
                    padding: 0;
                    list-style: none;
                    font-size: 12.5px;
                }

                .conc-list li {
                    margin: 2px 0;
                }

                .conc-mono {
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                }

                .conc-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 11px;
                    margin-top: 8px;
                }

                .conc-table th,
                .conc-table td {
                    border: 1px solid #e5e7eb;
                    padding: 6px 8px;
                    text-align: center;
                    word-break: break-word;
                }

                .conc-table th {
                    background: #eff6ff;
                    color: #1e3a8a;
                    font-weight: 600;
                }

                .conc-badge-ok {
                    display: inline-block;
                    padding: 2px 6px;
                    border-radius: 6px;
                    border: 1px solid #d1fae5;
                    background: #ecfdf5;
                    color: #065f46;
                    font-size: 10.5px;
                }

                .conc-badge-mid {
                    display: inline-block;
                    padding: 2px 6px;
                    border-radius: 6px;
                    border: 1px solid #fef3c7;
                    background: #fffbeb;
                    color: #92400e;
                    font-size: 10.5px;
                }

                .conc-badge-warn {
                    display: inline-block;
                    padding: 2px 6px;
                    border-radius: 6px;
                    border: 1px solid #fee2e2;
                    background: #fef2f2;
                    color: #991b1b;
                    font-size: 10.5px;
                }

                .conc-avoid-break {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
            </style>

            <div class="conc-wrap">
                {{-- Fila superior: 2 tarjetas lado a lado --}}
                <div class="conc-row conc-avoid-break" style="margin-bottom:8px;">
                    <div class="conc-col">
                        <div class="conc-card">
                            <div class="conc-title">Identificación</div>
                            <ul class="conc-list">
                                <li><small>Orden:</small> <span
                                        class="conc-mono">{{ $c->number_order ?? $plan->number_order }}</span></li>
                                <li><small>Cod. Artículo:</small> <span
                                        class="conc-mono">{{ $c->codart ?? $plan->codart }}</span></li>
                                <li><small>Producto:</small> {{ $c->desart ?? ($desart ?? '—') }}</li>
                                <li><small>Usuario:</small> {{ $c->user ?? '—' }}</li>
                                <li><small>Fecha:</small>
                                    {{ \Carbon\Carbon::parse($c->updated_at)->format('Y-m-d H:i') }}</li>
                            </ul>
                        </div>
                    </div>

                    <div class="conc-col">
                        <div class="conc-card">
                            <div class="conc-title">Totales</div>
                            <div class="conc-kpi"><small>Cant. a producir:</small> <span
                                    class="conc-strong">{{ $nf($c->quantityToProduce ?? $plan->quantityToProduce) }}</span>
                            </div>
                            <div class="conc-kpi conc-rowflex">
                                <small>Total resultante:</small> <span class="conc-strong">{{ $nf($c->total) }}</span>
                                <span class="{{ $rendClass }}" style="margin-left:6px;">Rendimiento:
                                    {{ $pf($rend) }}</span>
                            </div>
                            @if (!is_null($c->total) && !is_null($c->quantityToProduce ?? $plan->quantityToProduce))
                                @php $delta = (float)$c->total - (float)($c->quantityToProduce ?? $plan->quantityToProduce); @endphp
                                <div class="conc-kpi"><small>Diferencia:</small> <span
                                        class="{{ $delta >= 0 ? 'conc-strong' : '' }}">{{ $nf($delta) }}</span>
                                </div>
                            @endif
                        </div>
                    </div>
                </div>

                {{-- Fila inferior: Desvíos a lo ancho --}}
                <div class="conc-row conc-avoid-break">
                    <div class="conc-card">
                        <div class="conc-title">Desvíos</div>
                        @if (count($desvPresentes))
                            <table class="conc-table">
                                <thead>
                                    <tr>
                                        @foreach ($desvPresentes as $label)
                                            <th>{{ $label }}</th>
                                        @endforeach
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        @foreach ($desvPresentes as $key => $label)
                                            <td>{{ $nf($c->{$key}) }}</td>
                                        @endforeach
                                    </tr>
                                </tbody>
                            </table>
                        @else
                            <div class="conc-kpi"><span class="conc-badge-ok">Sin desvíos registrados</span></div>
                        @endif
                    </div>
                </div>
            </div>

            {{-- Línea de detalle resumida --}}
            <table class="table conc-avoid-break" style="margin-top:8px;">
                <thead>
                    <tr>
                        <th>Número de Orden</th>
                        <th>Total</th>
                        <th>Rendimiento</th>
                        <th>Actualizado</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{{ $plan->orderNumber ?? '—' }}</td>
                        <td>{{ $nf($c->total) }}</td>
                        <td>{{ is_null($c->rendimiento) ? '—' : $pf($c->rendimiento) }}</td>
                        <td>{{ \Carbon\Carbon::parse($c->updated_at)->format('Y-m-d H:i') }}</td>
                    </tr>
                </tbody>
            </table>
        @endif

        <h2>Controles de Proceso</h2>
        <style>
            .tabla-container {
                text-align: left;
                width: 100%;
            }

            .tabla-item {
                display: inline-block;
                vertical-align: top;
                width: 48%;
                margin: 0 2% 16px 0;
                page-break-inside: avoid;
            }

            .tabla-item:nth-child(2n) {
                margin-right: 0;
            }

            .table {
                width: 100%;
                border-collapse: collapse;
                font-size: 11px;
            }

            .table th,
            .table td {
                border: 1px solid #e5e7eb;
                padding: 6px 8px;
                text-align: center;
                word-break: break-word;
            }

            .table th {
                background-color: #eff6ff;
                font-weight: bold;
                color: #1e3a8a;
            }

            .evidence-img {
                max-width: 100%;
                max-height: 100px;
                object-fit: contain;
            }

            .data-label {
                font-weight: 500;
                color: #4b5563;
            }
        </style>

        <div class="tabla-container">
            @forelse ($timers as $timer)
                @forelse ($timer->timerControls as $control)
                    @php $rows = is_array($control->data) ? $control->data : []; @endphp

                    @if (count($rows))
                        <div class="tabla-item">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th style="width: 26%">Descripción</th>
                                        <th style="width: 35%">Resultado</th>
                                        <th style="width: 21%">Usuario</th>
                                        <th style="width: 18%">Fecha y Hora</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach ($rows as $item)
                                        @php
                                            $desc = $item['descripcion'] ?? ($item['description'] ?? '—');
                                            $valor = $item['valor'] ?? null;
                                            $isImg = is_string($valor) && str_starts_with($valor, 'data:image');
                                            $isArray = is_array($valor);
                                            $isTemp = $isArray && isset($valor['min'], $valor['max'], $valor['valor']);
                                        @endphp
                                        <tr>
                                            <td>{{ $desc }}</td>
                                            <td>
                                                @if ($isImg)
                                                    <img src="{{ $valor }}" alt="Evidencia"
                                                        class="evidence-img">
                                                @elseif ($isTemp)
                                                    <div class="data-label">
                                                        Min: {{ $valor['min'] }} | Máx: {{ $valor['max'] }} |
                                                        Medido: <strong>{{ $valor['valor'] }}</strong>
                                                    </div>
                                                @elseif ($isArray)
                                                    <span
                                                        class="data-label">{{ json_encode($valor, JSON_UNESCAPED_UNICODE) }}</span>
                                                @else
                                                    <span class="data-label">{{ $valor ?? '—' }}</span>
                                                @endif
                                            </td>
                                            <td>{{ $control->user->name ?? ($control->user ?? '—') }}</td>
                                            <td>{{ \Carbon\Carbon::parse($control->created_at)->format('Y-m-d H:i') }}
                                            </td>
                                        </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        </div>
                    @endif
                @empty
                @endforelse

            @endforelse
        </div>

        <footer>
            Documento generado automáticamente – Pharex S.A. | Confidencial
        </footer>
    </div>
</body>

</html>
