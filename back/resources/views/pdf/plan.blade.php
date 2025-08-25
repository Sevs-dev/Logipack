<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Batch Record - Orden {{ $plan->number_order }}</title>
    <style>
        @page { margin: 72px; }

        body {
            font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            font-size: 12px;
            background-color: #ffffff;
            padding: 0;
            line-height: 1.6;
            margin: 0;
            position: relative;
        }

        .content { position: relative; z-index: 1; max-width: 100%; }

        h1 {
            text-align: center;
            font-size: 20px;
            font-weight: 600;
            color: #1e3a8a;
            margin: 0 0 16px 0;
            letter-spacing: -0.5px;
        }

        /* H2 base (se mantiene) */
        h2 {
            font-size: 15px;
            font-weight: 600;
            color: #000000;
            text-align: center;
            margin: 32px 0 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #dbeafe;
        }

        /* Pegado de secciones: título + primer bloque */
        h2.section-title { margin: 18px 0 6px; page-break-after: avoid; }
        .section-keep { page-break-inside: avoid; break-inside: avoid; }

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
            margin: 8px 0 12px; /* más compacto */
            font-size: 11.5px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            table-layout: auto;
            page-break-inside: auto;
            break-inside: auto;
        }

        .table th, .table td {
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

        .table tr:nth-child(even) td { background-color: #f9fafb; }
        .table tr:last-child td { border-bottom: none; }

        .table-centered th, .table-centered td { text-align: center; }
        .table td.nowrap { white-space: nowrap; }
        .table td.right { text-align: right; }

        /* Stripe y hover */
        .table-striped tbody tr:nth-child(odd) td { background-color: #fff; }
        .table-striped tbody tr:hover td { background-color: #fff; transition: background-color 0.2s ease; }

        /* Evitar que UNA fila se parta entre páginas (OK) */
        .table tr { page-break-inside: avoid; break-inside: avoid; }

        /* Repetir thead al partir */
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }

        /* Listas */
        ul { padding-left: 18px; margin: 10px 0; list-style-type: square; }
        ul li { color: #4b5563; margin-bottom: 4px; font-size: 11.5px; }

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
            margin-top: 24px;
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
        .data-label { font-weight: 500; color: #4b5563; }

        /* ===== Diagrama tipo snake ===== */
        .snake-wrap { width: 100%; }
        .snake-row { width: 100%; margin-bottom: 6px; font-size: 0; } /* sin avoid aquí */
        .snake-cell, .snake-conn { display: inline-block; vertical-align: top; } /* sin avoid */
        .snake-cell { width: 31%; }
        .snake-conn { width: 3.5%; text-align: center; }

        .snake-card {
            border: 1px solid #e5e7eb;
            border-left: 4px solid #3b82f6;
            border-radius: 8px;
            padding: 8px;
            background: #fff;
            font-size: 12px;
            line-height: 1.35;
            min-height: 40px; /* reducido */
        }

        .snake-label { font-size: 11.5px; color: #111827; margin-bottom: 6px; font-weight: 600; }

        .snake-badge {
            display: inline-block;
            min-width: 26px; height: 26px; line-height: 26px; text-align: center;
            border-radius: 50%;
            border: 1px solid #93c5fd;
            background: #eff6ff; color: #1e3a8a; font-weight: 700; font-size: 11px;
        }

        .snake-conn .conn-line { border-top: 1px dashed #94a3b8; margin-top: 18px; }
        .snake-conn .conn-arrow { font-size: 12px; color: #1e3a8a; margin-top: 4px; white-space: nowrap; }

        /* ===== Operaciones Ejecutadas ===== */
        .op-h2 { page-break-after: avoid; }
        .op-title { margin: 0 0 6px; }
        .op-keep { page-break-inside: avoid; break-inside: avoid; }
        .op-table { page-break-inside: avoid; break-inside: avoid; } /* las tablas-chunk sí se mantienen juntas */

        /* ===== Controles de Proceso ===== */
        .tabla-container { text-align: left; width: 100%; }
        .tabla-item {
            display: inline-block; vertical-align: top;
            width: 48%; margin: 0 2% 16px 0; page-break-inside: auto; /* permitir flow */
        }
        .tabla-item:nth-child(2n) { margin-right: 0; }
        .keep-with-title { page-break-inside: avoid; break-inside: avoid; }
        .controls-title { page-break-after: avoid; }

        .table-striped tbody tr:nth-child(odd) td { background: #fff; }
        .data-label { font-weight: 500; color: #4b5563; }
        .evidence-img { max-width: 100%; max-height: 100px; object-fit: contain; }
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
        <div style="position: relative; display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
            <img src="{{ $base64 }}" alt="Logo" style="position: absolute; left: 0; height: 40px;">
            <h1 style="margin: 0; flex-grow: 1; text-align: center;">Batch Record de Producción</h1>
        </div>

        {{-- ===== Datos Generales ===== --}}
        <h2 class="section-title">Datos Generales</h2>
        <div class="section-keep">
            <table class="table">
                <tr>
                    <th style="width: 15%">Orden</th>
                    <td style="width: 35%">{{ $plan->number_order }}</td>
                    <th style="width: 15%">Cliente</th>
                    <td style="width: 35%">{{ $cliente->name ?? '—' }}</td>
                </tr>
            </table>
        </div>

        {{-- ===== Producto a Obtener ===== --}}
        <h2 class="section-title">Producto a Obtener</h2>
        <div class="section-keep">
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
        </div>

        {{-- ===== Diagrama de Operaciones ===== --}}
        <h2 class="section-title">Diagrama de Operaciones</h2>
        @php
            $stagesArr = collect($stages ?? [])
                ->values()
                ->map(function ($s, $i) {
                    $label = $s->description ?? 'Etapa ' . $s->id;
                    $label = trim(strip_tags((string) $label));
                    return ['id' => $s->id, 'label' => $label ?: 'Etapa ' . ($s->id ?? '?'), 'seq' => $i + 1];
                })
                ->toArray();
            $rows = array_chunk($stagesArr, 3);
            $firstRow = $rows ? array_shift($rows) : [];
        @endphp

        @if(!empty($firstRow))
            <div class="section-keep">
                <div class="snake-row">
                    @foreach ($firstRow as $idx => $stage)
                        <div class="snake-cell">
                            <div class="snake-card">
                                <div class="snake-label">
                                    <span class="snake-badge">{{ $stage['seq'] }}</span>
                                    <span style="margin-left:6px;">{{ $stage['label'] }}</span>
                                </div>
                            </div>
                        </div>
                        @if ($idx < count($firstRow) - 1)
                            <div class="snake-conn">
                                <div class="conn-line"></div>
                                <div class="conn-arrow"> --&gt; </div>
                            </div>
                        @endif
                    @endforeach
                </div>
            </div>
        @endif

        @if (count($rows))
            <div class="snake-wrap">
                @foreach ($rows as $row)
                    <div class="snake-row">
                        @foreach ($row as $idx => $stage)
                            <div class="snake-cell">
                                <div class="snake-card">
                                    <div class="snake-label">
                                        <span class="snake-badge">{{ $stage['seq'] }}</span>
                                        <span style="margin-left:6px;">{{ $stage['label'] }}</span>
                                    </div>
                                </div>
                            </div>
                            @if ($idx < count($row) - 1)
                                <div class="snake-conn">
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

        <div class="section-keep">
            <table class="table">
                <tr>
                    <th style="width: 10%">Receta validada por</th>
                    <td style="width: 35%">{{ $plan->user ? urldecode(preg_replace('/[\r\n]+/', '', $plan->user)) : 'Sin usuario' }}</td>
                    <th style="width: 15%">Cliente</th>
                    <td style="width: 15%">{{ $cliente->updated_at ?? '—' }}</td>
                </tr>
            </table>
        </div>

        {{-- ===== Resumen de Conciliación ===== --}}
        @php
            $cRaw = $conciliacion ?? null;
            $c = is_array($cRaw) ? (object) $cRaw : $cRaw;
            $nf = fn($v) => $v === null || $v === '' ? '—' : number_format((float) $v, 2, ',', '.');
            $pf = fn($v) => $v === null || $v === '' ? '—' : $nf($v) . '%';
            $val = fn($key, $default = null) => data_get($c, $key, $default);

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
                    if ($v != 0.0) $desvPresentes[$key] = $label;
                }
            }

            $rend = (float) $val('rendimiento', 0);
            $rendClass = $rend >= 99.5 ? 'conc-badge-ok' : ($rend >= 98.0 ? 'conc-badge-mid' : 'conc-badge-warn');
            $fechaConc = $val('updated_at') ? \Carbon\Carbon::parse($val('updated_at'))->format('Y-m-d H:i') : '—';
            $hasConc = $c && collect((array) $c)->filter(fn($v) => $v !== null && $v !== '')->isNotEmpty();
        @endphp

        @if ($hasConc)
            <h2 class="section-title">Resumen de Conciliación</h2>

            <style>
                .conc-wrap { width: 100%; }
                .conc-row { width: 100%; }
                .conc-col { display: inline-block; vertical-align: top; width: 49%; margin: 0 1% 0 0; }
                .conc-col:last-child { margin-right: 0; }
                .conc-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
                .conc-title { margin: 0 0 6px 0; font-size: 12px; color: #1e40af; font-weight: 700; }
                .conc-kpi { font-size: 12.75px; color: #111827; line-height: 1.45; }
                .conc-kpi small { color: #6b7280; font-weight: 500; }
                .conc-rowflex { display: block; }
                .conc-strong { font-weight: 600; }
                .conc-list { margin: 0; padding: 0; list-style: none; font-size: 12.5px; }
                .conc-list li { margin: 2px 0; }
                .conc-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
                .conc-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
                .conc-table th, .conc-table td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: center; word-break: break-word; }
                .conc-table th { background: #eff6ff; color: #1e3a8a; font-weight: 600; }
                .conc-badge-ok { display:inline-block; padding:2px 6px; border-radius:6px; border:1px solid #d1fae5; background:#ecfdf5; color:#065f46; font-size:10.5px; }
                .conc-badge-mid { display:inline-block; padding:2px 6px; border-radius:6px; border:1px solid #fef3c7; background:#fffbeb; color:#92400e; font-size:10.5px; }
                .conc-badge-warn { display:inline-block; padding:2px 6px; border-radius:6px; border:1px solid #fee2e2; background:#fef2f2; color:#991b1b; font-size:10.5px; }
            </style>

            {{-- H2 + fila superior pegados --}}
            <div class="section-keep" style="margin-bottom:8px;">
                <div class="conc-row">
                    <div class="conc-col">
                        <div class="conc-card">
                            <div class="conc-title">Identificación</div>
                            <ul class="conc-list">
                                <li><small>Orden:</small> <span class="conc-mono">{{ $c->number_order ?? $plan->number_order }}</span></li>
                                <li><small>Cod. Artículo:</small> <span class="conc-mono">{{ $c->codart ?? $plan->codart }}</span></li>
                                <li><small>Producto:</small> {{ $c->desart ?? ($desart ?? '—') }}</li>
                                <li><small>Usuario:</small> {{ $c->user ?? '—' }}</li>
                                <li><small>Fecha:</small> {{ \Carbon\Carbon::parse($c->updated_at)->format('Y-m-d H:i') }}</li>
                            </ul>
                        </div>
                    </div>
                    <div class="conc-col">
                        <div class="conc-card">
                            <div class="conc-title">Totales</div>
                            <div class="conc-kpi"><small>Cant. a producir:</small> <span class="conc-strong">{{ $nf($c->quantityToProduce ?? $plan->quantityToProduce) }}</span></div>
                            <div class="conc-kpi conc-rowflex">
                                <small>Total resultante:</small> <span class="conc-strong">{{ $nf($c->total) }}</span>
                                <span class="{{ $rendClass }}" style="margin-left:6px;">Rendimiento: {{ $pf($rend) }}</span>
                            </div>
                            @if (!is_null($c->total) && !is_null($c->quantityToProduce ?? $plan->quantityToProduce))
                                @php $delta = (float)$c->total - (float)($c->quantityToProduce ?? $plan->quantityToProduce); @endphp
                                <div class="conc-kpi"><small>Diferencia:</small> <span class="{{ $delta >= 0 ? 'conc-strong' : '' }}">{{ $nf($delta) }}</span></div>
                            @endif
                        </div>
                    </div>
                </div>
            </div>

            {{-- Resto --}}
            <div class="conc-row">
                <div class="conc-card">
                    <div class="conc-title">Desvíos</div>
                    @if (count($desvPresentes))
                        <table class="conc-table">
                            <thead>
                                <tr>
                                    @foreach ($desvPresentes as $label) <th>{{ $label }}</th> @endforeach
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    @foreach ($desvPresentes as $key => $label) <td>{{ $nf($c->{$key}) }}</td> @endforeach
                                </tr>
                            </tbody>
                        </table>
                    @else
                        <div class="conc-kpi"><span class="conc-badge-ok">Sin desvíos registrados</span></div>
                    @endif
                </div>
            </div>

            <table class="table" style="margin-top:8px;">
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
        {{-- ===== Fin Resumen de Conciliación ===== --}}

        {{-- ===== Operaciones Ejecutadas ===== --}}
        <h2 class="section-title op-h2">Operaciones Ejecutadas</h2>

        @php
            /* ========= Helpers ========= */
            $fmtTime = function ($ts) {
                try { return $ts ? \Carbon\Carbon::parse($ts)->format('H:i') : '—'; }
                catch (\Throwable $e) { return '—'; }
            };

            $renderValor = function ($valor) {
                if ($valor === null || $valor === '') return '<span class="data-label">—</span>';
                if (is_bool($valor)) return '<span class="data-label">'.($valor ? 'Sí' : 'No').'</span>';
                if (is_numeric($valor)) return '<span class="data-label">'.e($valor).'</span>';

                if (is_string($valor)) {
                    if (str_starts_with($valor, 'data:image')) return '<img src="'.e($valor).'" alt="Evidencia" class="evidence-img">';
                    if (filter_var($valor, FILTER_VALIDATE_URL)) {
                        $lower = strtolower($valor);
                        if (preg_match('/\.(png|jpe?g|webp|gif)$/', $lower)) return '<img src="'.e($valor).'" alt="Evidencia" class="evidence-img">';
                        $label = str_ends_with($lower, '.pdf') ? 'Ver PDF' : 'Abrir enlace';
                        return '<a href="'.e($valor).'" target="_blank" rel="noopener" class="data-link">'.e($label).'</a>';
                    }
                    return '<span class="data-label">'.e($valor).'</span>';
                }

                if (is_array($valor)) {
                    if (isset($valor['min']) || isset($valor['max']) || isset($valor['valor'])) {
                        $min = isset($valor['min']) ? e($valor['min']) : '—';
                        $max = isset($valor['max']) ? e($valor['max']) : '—';
                        $val = isset($valor['valor']) ? e($valor['valor']) : '—';
                        return '<span class="data-label"><strong>Mín:</strong> '.$min.' &nbsp; <strong>Máx:</strong> '.$max.' &nbsp; <strong>Medido:</strong> '.$val.'</span>';
                    }
                    $isList = function ($arr) {
                        if (function_exists('array_is_list')) return array_is_list($arr);
                        $i = 0; foreach ($arr as $k => $_) { if ($k !== $i++) return false; } return true;
                    };
                    if ($isList($valor)) {
                        $html = '<span class="data-label">';
                        foreach ($valor as $v) $html .= '• '.e(is_scalar($v) ? $v : json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)).'<br>';
                        $html .= '</span>'; return $html;
                    }
                    return '<code class="data-code">'.e(json_encode($valor, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)).'</code>';
                }

                return '<span class="data-label">'.e((string)$valor).'</span>';
            };

            $normalize = function ($v) {
                $s = is_string($v) ? strip_tags($v) : '';
                $s = trim(mb_strtolower($s));
                $s = preg_replace('/\s+/u', ' ', $s);
                $t = @iconv('UTF-8', 'ASCII//TRANSLIT', $s);
                return $t !== false ? $t : $s;
            };

            /* ========= Orden del diagrama ========= */
            $stageOrderById = collect($stages ?? [])->values()->mapWithKeys(fn($s, $i) => [$s->id => $i]);
            $stageOrderByLabel = collect($stages ?? [])->values()->mapWithKeys(function ($s, $i) use ($normalize) {
                $label = $s->description ?? 'Etapa ' . $s->id;
                return [$normalize($label) => $i];
            });

            /* ========= 1) Dedup por id ========= */
            $acts = collect($actividadesEjecutadas ?? [])->unique('id')->values();

            /* ========= 2) Agrupar por stage (mismo ID o mismo label) ========= */
            $grouped = $acts
                ->map(function ($a) use ($normalize) {
                    $sid = $a['fases_fk'] ?? ($a['stage_id'] ?? ($a['id_stage'] ?? ($a['stage'] ?? null)));
                    $labelKey = $normalize($a['description_fase'] ?? '');
                    $key = $sid ? 'id:' . $sid : 'label:' . $labelKey;

                    $forms = $a['forms'] ?? [];
                    if (is_string($forms)) { $dec = json_decode($forms, true); $forms = is_array($dec) ? $dec : []; }
                    $a['forms'] = is_array($forms) ? array_values($forms) : [];
                    return ['key' => $key, 'raw' => $a];
                })
                ->groupBy('key')
                ->map(function ($bucket) {
                    $first = $bucket->first()['raw'];
                    $allForms = [];
                    $minCreated = null;
                    $minId = PHP_INT_MAX;

                    foreach ($bucket as $item) {
                        $raw = $item['raw'];
                        $forms = $raw['forms'] ?? [];
                        if (is_array($forms)) {
                            foreach ($forms as $f) {
                                if (is_array($f) && (!empty($f['descripcion_activitie']) || !empty($f['valor']))) {
                                    $allForms[] = $f;
                                }
                            }
                        }
                        $created = $raw['created_at'] ?? null;
                        $ts = null;
                        try { $ts = $created ? \Carbon\Carbon::parse($created)->timestamp : null; } catch (\Throwable $e) {}
                        if ($minCreated === null || ($ts !== null && $ts < $minCreated)) $minCreated = $ts;

                        $idVal = isset($raw['id']) ? (int) $raw['id'] : PHP_INT_MAX;
                        if ($idVal < $minId) $minId = $idVal;
                    }

                    $first['forms'] = $allForms;
                    $first['_min_created'] = $minCreated ?? 0;
                    $first['_min_id'] = $minId;
                    if (empty($first['description_fase'])) $first['description_fase'] = '—';

                    return $first;
                });

            /* ========= 3) Orden final según diagrama + desempates ========= */
            $actsSorted = $grouped
                ->sortBy(function ($a) use ($stageOrderById, $stageOrderByLabel, $normalize) {
                    $sid = $a['fases_fk'] ?? ($a['stage_id'] ?? ($a['id_stage'] ?? ($a['stage'] ?? null)));
                    $rank = PHP_INT_MAX;
                    if ($sid !== null && $sid !== '' && isset($stageOrderById[$sid])) $rank = $stageOrderById[$sid];
                    else {
                        $key = $normalize($a['description_fase'] ?? '');
                        if ($key !== '' && isset($stageOrderByLabel[$key])) $rank = $stageOrderByLabel[$key];
                    }
                    $minCreated = (int) ($a['_min_created'] ?? 0);
                    $minId = (int) ($a['_min_id'] ?? 0);
                    return $rank * 1000000000 + $minCreated * 1000 + $minId;
                })
                ->values();
        @endphp

        @foreach ($actsSorted as $index => $actividad)
            @php
                $forms = $actividad['forms'] ?? [];
                $formsChunks = array_chunk($forms, 12); /* puedes bajar a 10/8 si hay imágenes */
                $firstChunk = $formsChunks ? array_shift($formsChunks) : [];
            @endphp

            @if (!empty($firstChunk))
                {{-- TÍTULO + PRIMER CHUNK PEGADOS --}}
                <div class="op-keep">
                    <h3 class="op-title">{{ $index + 1 }}. {{ $actividad['description_fase'] ?? '—' }}</h3>
                    <table class="table table-striped op-table">
                        <thead>
                            <tr>
                                <th style="width:30%">Actividad</th>
                                <th style="width:25%">Resultado</th>
                                <th style="width:15%">Línea</th>
                                <th style="width:15%">Usuario</th>
                                <th style="width:15%">Hora</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($firstChunk as $form)
                                @php
                                    $desc = $form['descripcion_activitie'] ?? ($form['description'] ?? '—');
                                    $valor = $form['valor'] ?? null;
                                    $linea = $form['linea'] ?? '—';
                                    $user = isset($actividad['user']) ? urldecode($actividad['user']) : '—';
                                    $hora = $fmtTime($form['created_at'] ?? ($actividad['created_at'] ?? null));
                                @endphp
                                <tr>
                                    <td>{{ $desc }}</td>
                                    <td>{!! $renderValor($valor) !!}</td>
                                    <td>{{ $linea }}</td>
                                    <td>{{ $user }}</td>
                                    <td>{{ $hora }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>

                {{-- RESTO DE CHUNKS --}}
                @foreach ($formsChunks as $chunk)
                    <table class="table table-striped op-table">
                        <thead>
                            <tr>
                                <th style="width:30%">Actividad</th>
                                <th style="width:25%">Resultado</th>
                                <th style="width:15%">Línea</th>
                                <th style="width:15%">Usuario</th>
                                <th style="width:15%">Hora</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($chunk as $form)
                                @php
                                    $desc = $form['descripcion_activitie'] ?? ($form['description'] ?? '—');
                                    $valor = $form['valor'] ?? null;
                                    $linea = $form['linea'] ?? '—';
                                    $user = isset($actividad['user']) ? urldecode($actividad['user']) : '—';
                                    $hora = $fmtTime($form['created_at'] ?? ($actividad['created_at'] ?? null));
                                @endphp
                                <tr>
                                    <td>{{ $desc }}</td>
                                    <td>{!! $renderValor($valor) !!}</td>
                                    <td>{{ $linea }}</td>
                                    <td>{{ $user }}</td>
                                    <td>{{ $hora }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                @endforeach
            @endif
        @endforeach

        {{-- ===== Controles de Proceso ===== --}}
        <h2 class="section-title controls-title">Controles de Proceso</h2>

        @php
            // Aplana controles en una lista de tarjetas
            $controlCards = [];
            foreach ($timers as $timer) {
                foreach ($timer->timerControls as $control) {
                    $rows = is_array($control->data) ? $control->data : [];
                    if (count($rows)) $controlCards[] = $control;
                }
            }
        @endphp

        @if (count($controlCards))
            @php
                $firstCard = array_shift($controlCards);
                $firstRows = is_array($firstCard->data) ? $firstCard->data : [];
                $firstChunks = array_chunk($firstRows, 12);
            @endphp

            {{-- Título + primera tarjeta pegados --}}
            <div class="tabla-item keep-with-title">
                @foreach ($firstChunks as $chunk)
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th style="width:26%">Descripción</th>
                                <th style="width:35%">Resultado</th>
                                <th style="width:21%">Usuario</th>
                                <th style="width:18%">Fecha y Hora</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($chunk as $item)
                                @php
                                    $desc = $item['descripcion'] ?? ($item['description'] ?? '—');
                                    $valor = $item['valor'] ?? null;
                                    $isImg = is_string($valor) && str_starts_with($valor, 'data:image');
                                    $isArr = is_array($valor);
                                    $isTemp = $isArr && isset($valor['min'], $valor['max'], $valor['valor']);
                                    $userNm = $firstCard->user->name ?? ($firstCard->user ?? '—');
                                    $fecha = \Carbon\Carbon::parse($firstCard->created_at)->format('Y-m-d H:i');
                                @endphp
                                <tr>
                                    <td>{{ $desc }}</td>
                                    <td>
                                        @if ($isImg)
                                            <img src="{{ $valor }}" alt="Evidencia" class="evidence-img">
                                        @elseif ($isTemp)
                                            <div class="data-label">
                                                Min: {{ $valor['min'] }} | Máx: {{ $valor['max'] }} | Medido:
                                                <strong>{{ $valor['valor'] }}</strong>
                                            </div>
                                        @elseif ($isArr)
                                            <span class="data-label">{{ json_encode($valor, JSON_UNESCAPED_UNICODE) }}</span>
                                        @else
                                            <span class="data-label">{{ $valor ?? '—' }}</span>
                                        @endif
                                    </td>
                                    <td>{{ $userNm }}</td>
                                    <td>{{ $fecha }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                @endforeach
            </div>

            <div class="tabla-container">
                @foreach ($controlCards as $control)
                    @php
                        $rows = is_array($control->data) ? $control->data : [];
                        $chunks = array_chunk($rows, 12);
                    @endphp
                    @if (count($rows))
                        <div class="tabla-item">
                            @foreach ($chunks as $chunk)
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th style="width:26%">Descripción</th>
                                            <th style="width:35%">Resultado</th>
                                            <th style="width:21%">Usuario</th>
                                            <th style="width:18%">Fecha y Hora</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @foreach ($chunk as $item)
                                            @php
                                                $desc = $item['descripcion'] ?? ($item['description'] ?? '—');
                                                $valor = $item['valor'] ?? null;
                                                $isImg = is_string($valor) && str_starts_with($valor, 'data:image');
                                                $isArr = is_array($valor);
                                                $isTemp = $isArr && isset($valor['min'], $valor['max'], $valor['valor']);
                                                $userNm = $control->user->name ?? ($control->user ?? '—');
                                                $fecha = \Carbon\Carbon::parse($control->created_at)->format('Y-m-d H:i');
                                            @endphp
                                            <tr>
                                                <td>{{ $desc }}</td>
                                                <td>
                                                    @if ($isImg)
                                                        <img src="{{ $valor }}" alt="Evidencia" class="evidence-img">
                                                    @elseif ($isTemp)
                                                        <div class="data-label">
                                                            Min: {{ $valor['min'] }} | Máx: {{ $valor['max'] }} | Medido:
                                                            <strong>{{ $valor['valor'] }}</strong>
                                                        </div>
                                                    @elseif ($isArr)
                                                        <span class="data-label">{{ json_encode($valor, JSON_UNESCAPED_UNICODE) }}</span>
                                                    @else
                                                        <span class="data-label">{{ $valor ?? '—' }}</span>
                                                    @endif
                                                </td>
                                                <td>{{ $userNm }}</td>
                                                <td>{{ $fecha }}</td>
                                            </tr>
                                        @endforeach
                                    </tbody>
                                </table>
                            @endforeach
                        </div>
                    @endif
                @endforeach
            </div>
        @endif

        <footer>Documento generado automáticamente – Pharex S.A. | Confidencial</footer>
    </div>
</body>
</html>
