<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Orden {{ $plan->number_order }} — {{ $cliente->name ?? 'Cliente' }}</title>
    <meta name="author" content="Logismart">
    <meta name="subject" content="Orden de producción">
    <style>
        @charset "UTF-8";
        /* ===== PÁGINA / TIPOGRAFÍA / RESETEOS ===== */
        @page { margin: 60px 48px 64px 48px; }
        * { box-sizing: border-box; }

        body {
            font-family: 'DejaVu Sans', 'Noto Sans', sans-serif;
            font-size: 12px;
            line-height: 1.35;
            color: #111827;
            background: #fff;
            margin: 0;
            padding: 0;
        }
        .content { position: relative; z-index: 1; max-width: 100%; }

        /* ===== TITULARES ===== */
        h1 {
            text-align: center;
            font-size: 18.5px;
            font-weight: 700;
            color: #1e3a8a;
            margin: 0 0 24px;
            letter-spacing: -0.3px;
            page-break-after: avoid;
        }
        h2, h3 { page-break-after: auto; }
        h2 {
            font-size: 10.5px;
            font-weight: 700;
            color: #0f172a;
            text-align: center;
            margin: 12px 0 8px;
            padding-bottom: 6px;
            border-bottom: 1px solid #dbeafe;
        }
        h2.section-title { margin: 12px 0 6px; }
        h3 {
            font-size: 9px;
            font-weight: 700;
            color: #1e40af;
            margin: 10px 0 6px;
        }
        .keep-title-only { page-break-after: avoid; }

        /* ===== TABLAS ===== */
        table { width: 100%; border-collapse: collapse; table-layout: auto; border-radius: 2px; }

        .table {
            margin: 4px 0;
            font-size: 8px;
            border: 1px solid #1e1ef854;
            border-radius: 8px;
            page-break-inside: auto; break-inside: auto;
        }
        .table th, .table td {
            padding: 2px 2px;
            border: 1px solid #1e1ef854;
            vertical-align: middle;
            word-break: break-word;
            white-space: normal;
            text-align: center;
        }
        .table th { background: #eff6ff; color: #1e3a8a; font-weight: 500; }
        .table td { background: #fff; color: #374151; }
        .table tr:nth-child(even) td { background: #f9fafb; }
        .table-striped tbody tr:nth-child(odd) td { background: #fff; }
        .table-striped tbody tr:hover td { background: #fff; transition: background-color .2s ease; }

        /* Fila indivisible (no partir un <tr>) */
        .table tr { page-break-inside: avoid; break-inside: avoid; }

        /* Encabezado repetido y anti-huérfano (SIEMPRE con al menos una fila) */
        .table thead { display: table-header-group; page-break-after: avoid; }
        .table thead tr { page-break-inside: avoid; page-break-after: avoid; }
        .table tbody tr:first-child { page-break-before: avoid; }

        /* Alias también para op-table por si acaso */
        .op-table thead { display: table-header-group; page-break-after: avoid; }
        .op-table thead tr { page-break-inside: avoid; page-break-after: avoid; }
        .op-table tbody tr:first-child { page-break-before: avoid; }

        tfoot { display: table-footer-group; }

        .table-centered th, .table-centered td { text-align: center; }
        .nowrap { white-space: nowrap; }
        .right { text-align: right; }

        /* ===== LISTAS ===== */
        ul { padding-left: 16px; margin: 6px 0; list-style-type: square; }
        ul li { color: #4b5563; margin-bottom: 2px; font-size: 11px; }

        /* ===== EVIDENCIAS (imágenes) ===== */
        .evidence-img {
            max-width: 100%; max-height: 100px; object-fit: contain;
            border-radius: 4px; border: 1px solid #d1d5db;
        }

        /* ===== MARCA DE AGUA ===== */
        .watermark {
            position: fixed; top: 50%; left: 45%;
            transform: translate(-50%, -50%) rotate(-30deg);
            opacity: 0.07; pointer-events: none; z-index: 0;
            width: 680px; filter: grayscale(100%);
        }

        /* ===== DIAGRAMA SNAKE ===== */
        .snake-wrap { width: 100%; }
        .snake-row { width: 100%; margin-bottom: 6px; font-size: 0; }
        .snake-cell, .snake-conn { display: inline-block; vertical-align: top; }
        .snake-cell { width: 31%; }
        .snake-conn { width: 3.5%; text-align: center; }
        .snake-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px; background: #fff; min-height: 40px; }
        .snake-label { display: flex; align-items: center; width: 100%; gap: 6px; font-size: 8px; color: #111827; margin-bottom: 4px; font-weight: 700; }
        .snake-badge { display: inline-block; min-width: 18px; height: 18px; line-height: 16px; text-align: center; border-radius: 50%; margin-top: 10px; border: 1px solid #0077fe61; background: #eff6ff; color: #0044ff; font-weight: 800; font-size: 10.5px; flex: 0 0 auto; }
        .snake-text { flex: 1 1 auto; text-align: center; margin-left: 4px; }
        .conn-arrow { font-size: 12px; color: #1e3a8a; margin-top: 20px; white-space: nowrap; }

        /* ===== OPERACIONES EJECUTADAS ===== */
        .op-h2 { page-break-after: avoid; }
        .op-title { margin: 0 0 6px; }
        .op-table { page-break-inside: auto; break-inside: auto; }

        .op-version { margin-top: 1.25rem; }
        .op-version-title {
            font-size: 1rem; font-weight: 700; color: #111827;
            margin: .75rem 0 .25rem; display: flex; gap: .5rem; align-items: center;
        }
        .op-version-code {
            font-size: .75rem; font-weight: 600; color: #374151;
            border: 1px solid #d1d5db; border-radius: .375rem; padding: .1rem .4rem; background: #f9fafb;
        }

        /* ===== CONTROLES DE PROCESO ===== */
        .tabla-container { width: 100%; font-size: 0; }
        .tabla-item {
            display: inline-block; vertical-align: top; width: 49%;
            margin: 0 2% 10px 0; font-size: 12px; page-break-inside: avoid; break-inside: avoid;
        }
        .tabla-item:nth-child(2n) { margin-right: 0; }

        /* ===== RESUMEN CONCILIACIÓN ===== */
        .conc-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; page-break-inside: avoid; break-inside: avoid; }
        .conc-title { margin: 0 0 6px; font-size: 12px; color: #1e40af; font-weight: 700; }
        .conc-kpi { font-size: 12.5px; color: #111827; line-height: 1.4; }
        .conc-kpi small { color: #6b7280; font-weight: 500; }
        .conc-list { margin: 0; padding: 0; list-style: none; font-size: 12px; }
        .conc-list li { margin: 2px 0; }
        .conc-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
        .conc-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 6px; }
        .conc-table th, .conc-table td { border: 1px solid #e5e7eb; padding: 5px 6px; text-align: center; word-break: break-word; }
        .conc-table th { background: #eff6ff; color: #1e3a8a; font-weight: 700; }
        .conc-badge { display: inline-block; padding: 2px 6px; border-radius: 6px; font-size: 10.5px; }
        .conc-badge.ok { border: 1px solid #d1fae5; background: #ecfdf5; color: #065f46; }
        .conc-badge.mid { border: 1px solid #fef3c7; background: #fffbeb; color: #92400e; }
        .conc-badge.warn { border: 1px solid #fee2e2; background: #fef2f2; color: #991b1b; }

        .data-label { font-weight: 500; color: #4b5563; }

        /* ===== FOOTER/PAGINADO ===== */
        footer.pdf-footer {
            position: fixed;
            bottom: 22px; left: 48px; right: 48px;
            font-size: 10px; color: #6b7280;
            display: flex; align-items: center; justify-content: flex-end; gap: 8px;
            border-top: 1px solid #e5e7eb; padding-top: 8px; background: #fff; z-index: 2;
        }
        .pagenum::before { content: counter(page); }
        .pagecount::before { content: counter(pages); }
    </style>
</head>

<body>
    {{-- ✅ Marca de agua por detrás --}}
    @php
        $path = public_path('images/logo.png');
        $type = pathinfo($path, PATHINFO_EXTENSION);
        $data = file_get_contents($path);
        $base64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
    @endphp
    <img src="{{ $base64 }}" alt="Marca de agua Pharex" class="watermark" />

    <div class="content">
        <!-- Header compacto con logo -->
        <div style="position:relative; display:flex; align-items:center; justify-content:center; margin: 0 0 10px;">
            <img src="{{ $base64 }}" alt="Logo" style="position:absolute; left:0; height:38px;" />
            <h1>Batch Record de Producción</h1>
        </div>

        {{-- ===== Datos Generales ===== --}}
        <h2 class="section-title keep-title-only">Datos Generales</h2>
        <div>
            <table class="table">
                <thead>
                    <tr>
                        <th style="width:15%">Orden</th>
                        <th style="width:35%">Valor</th>
                        <th style="width:15%">Cliente</th>
                        <th style="width:35%">Valor</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Orden</td>
                        <td>{{ $plan->number_order }}</td>
                        <td>Cliente</td>
                        <td>{{ $cliente->name ?? '—' }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        {{-- ===== Producto a Obtener ===== --}}
        <h2 class="section-title keep-title-only">Producto a Obtener</h2>
        {{-- @dd($desart) --}}
        <div>
            <table class="table">
                <thead>
                    <tr>
                        <th>Código Artículo</th>
                        <th>Producto</th>
                        <th>Lote</th>
                        <th>F. Vencimiento</th>
                        <th>Cantidad</th>
                        <th>N° de Orden Cliente</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{{ $plan->codart }}</td>
                        <td>{{ $desart ?? 'No contiene Nombre' }}</td>
                        <td>{{ $plan->lot ?? '—' }}</td>
                        <td>{{ \Carbon\Carbon::parse($plan->deliveryDate)->format('Y-m-d') ?? '—' }}</td>
                        <td>{{ $plan->quantityToProduce }} unidades</td>
                        <td>{{ $plan->orderNumber }}</td>
                    </tr>
                </tbody>
            </table>
        </div> 

        {{-- ===== Diagrama de Operaciones (snake) ===== --}}
        <h2 class="section-title keep-title-only">Diagrama de Operaciones</h2>
        @php
            $stagesArr = collect($stages ?? [])->values()->map(function ($s, $i) {
                $label = $s->description ?? 'Etapa ' . $s->id;
                $label = trim(strip_tags((string) $label));
                return ['id' => $s->id, 'label' => $label ?: 'Etapa ' . ($s->id ?? '?'), 'seq' => $i + 1];
            })->toArray();
            $rows = array_chunk($stagesArr, 3);
            $firstRow = $rows ? array_shift($rows) : [];
        @endphp

        @if (!empty($firstRow))
            <div>
                <div class="snake-row">
                    @foreach ($firstRow as $idx => $stage)
                        <div class="snake-cell">
                            <div class="snake-card">
                                <div class="snake-label">
                                    <span class="snake-badge">{{ $stage['seq'] }}</span>
                                    <span class="snake-text">{{ $stage['label'] }}</span>
                                </div>
                            </div>
                        </div>
                        @if ($idx < count($firstRow) - 1)
                            <div class="snake-conn"><div class="conn-arrow"> --&gt; </div></div>
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
                                        <span class="snake-text">{{ $stage['label'] }}</span>
                                    </div>
                                </div>
                            </div>
                            @if ($idx < count($row) - 1)
                                <div class="snake-conn"><div class="conn-arrow"> --&gt; </div></div>
                            @endif
                        @endforeach
                    </div>
                @endforeach
            </div>
        @endif
        {{-- ===== Fin Diagrama ===== --}}

        {{-- ===== Elaborado y Aprobado ===== --}}
        <h2 class="section-title keep-title-only">Elaborado y Aprobado</h2>
        <div> 
            <table class="table">
                <thead>
                    <tr>
                        <th style="width:12%">Elaborado</th>
                        <th style="width:38%">Usuario</th>
                        <th style="width:10%">Fecha</th>
                        <th style="width:15%">Aprobado</th>
                        <th>Usuario</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Elabodara por:</td>
                        <td>{{ $plan->user ?? 'Sin usuario' }}</td>
                        <td>{{ $plan->order_time?->timezone('America/Bogota')->format('d/m/Y H:i') ?? '—' }} </td>
                        <td>Aprobada por:</td>
                        <td>{{ $plan->planning_user ?? 'Sin usuario' }}</td>
                        <td>{{ $plan->planning_time?->timezone('America/Bogota')->format('d/m/Y H:i') ?? '—' }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        {{-- ===== Resumen de Conciliación ===== --}}
        <h2 class="section-title keep-title-only">Resumen de Conciliación</h2>

        @php
            // Normalizamos: si hay varias, las usamos; si no, usamos la única.
            $concList = collect($conciliaciones ?? [])->filter(fn ($x) => !is_null($x))->values();
            if ($concList->isEmpty() && !empty($conciliacion)) {
                $concList = collect([$conciliacion]);
            }
        @endphp

        @foreach ($concList as $cItem)
            @php
                $cRaw = $cItem ?? null;
                $c = is_array($cRaw) ? (object) $cRaw : $cRaw;

                $nf = function ($v) {
                    return ($v === null || $v === '') ? '—' : number_format((float) $v, 2, ',', '.');
                };
                $pf = function ($v) use ($nf) {
                    return ($v === null || $v === '') ? '—' : $nf($v) . '%';
                };
                $val = function ($key, $default = null) use ($c) {
                    return data_get($c, $key, $default);
                };

                $rend = (float) $val('rendimiento', 0);
                $rendClass = $rend >= 99.5 ? 'ok' : ($rend >= 98.0 ? 'mid' : 'warn');
                $hasConc = $c && collect((array) $c)->filter(fn ($v) => $v !== null && $v !== '')->isNotEmpty();
            @endphp

            @if ($hasConc)
                <div style="margin-bottom:6px;">
                    <table class="table">
                        <tr>
                            <th style="width:12%">Cod. Artículo</th>
                            <td style="width:20%">{{ $c->codart ?? $plan->codart }}</td>
                            <th style="width:10%">Lote</th>
                            <td style="width:18%">{{ $plan->lot }}</td>
                            <th style="width:12%">Descripción</th>
                            <td>{{ $desart }}</td>
                        </tr>
                        <tr>
                            <th style="width:12%">Cant. Teórica</th>
                            <td style="width:18%">{{ isset($c->quantityToProduce) ? number_format($c->quantityToProduce,0,',','.') : '' }}</td>
                            <th style="width:10%">Faltantes</th>
                            <td style="width:18%">{{ isset($c->faltante) ? number_format($c->faltante,0,',','.') : '' }}</td>
                            <th style="width:12%">Adicionales</th>
                            <td style="width:18%">{{ isset($c->adicionales) ? number_format($c->adicionales,0,',','.') : '' }}</td>
                        </tr>
                        <tr>
                            <th style="width:12%">Rechazo</th>
                            <td style="width:18%">{{ isset($c->rechazo) ? number_format($c->rechazo,0,',','.') : '' }}</td>
                            <th style="width:14%">Daño Proceso</th>
                            <td style="width:18%">{{ isset($c->danno_proceso) ? number_format($c->danno_proceso,0,',','.') : '' }}</td>
                            <th style="width:12%">Devoluciones</th>
                            <td style="width:18%">{{ isset($c->devolucion) ? number_format($c->devolucion,0,',','.') : '' }}</td>
                        </tr>
                    </table>
                    <table class="table">
                        <tr>
                            <th style="width:18%">Unidades por caja</th>
                            <td style="width:14%">{{ isset($c->unidades_caja) ? number_format($c->unidades_caja,0,',','.') : '' }}</td>
                            <th style="width:12%">N° cajas</th>
                            <td style="width:14%">{{ isset($c->numero_caja) ? number_format($c->numero_caja,0,',','.') : '' }}</td>
                            <th style="width:18%">Unidades saldo</th>
                            <td style="width:14%">{{ isset($c->unidades_saldo) ? number_format($c->unidades_saldo,0,',','.') : '' }}</td>
                            <th style="width:12%">Total unidades</th>
                            <td style="width:14%">{{ isset($c->total_saldo) ? number_format($c->total_saldo,0,',','.') : '' }}</td>
                        </tr>
                    </table>
                    <table class="table">
                        <tr>
                            <th style="width:15%">Total Entregado</th>
                            <td style="width:15%">{{ isset($c->total) ? number_format($c->total,0,',','.') : '' }}</td>
                            <th style="width:15%">Rendimiento</th>
                            <td style="width:55%">
                                <span class="conc-badge {{ $rendClass }}">Rendimiento: {{ $pf($rend) }}</span>
                            </td>
                        </tr>
                    </table>
                </div>
            @endif
        @endforeach

       {{-- ===== Operaciones Ejecutadas ===== --}}
        <h2 class="section-title op-h2">Operaciones Ejecutadas</h2>

        @php
            // Fecha/Hora: DD/MM/YY HH:mm (usa TZ de la app o Bogotá)
           $fmtDateTime = function ($ts, $tz = null) {
                try {
                    if (!$ts) return '—';
                    $dt = \Carbon\Carbon::parse($ts)
                        ->setTimezone($tz ?? (config('app.timezone') ?: 'America/Bogota'));
                    return $dt->format('d/m/Y - H:i'); // día/mes/año primero
                } catch (\Throwable $e) {
                    return '—';
                }
            };

            // ===== NUEVO: helpers para decidir visibilidad de columnas =====
            $isEmptyish = function ($v) {
                if ($v === null) return true;
                if (is_bool($v)) return false; // bool es dato (Sí/No)
                if (is_string($v)) {
                    $t = trim($v);
                    return ($t === '' || $t === '—' || $t === '0');
                }
                if (is_numeric($v)) return ((float)$v) == 0.0; // 0 cuenta como "vacío" para visibilidad
                if (is_array($v)) return count($v) === 0;
                return false;
            };

            $hasMeaningfulValor = function ($valor) use ($isEmptyish) {
                if ($valor === null) return false;
                if (is_bool($valor)) return true; // false también es dato válido
                if (is_string($valor)) {
                    $t = trim($valor);
                    if ($t === '' || $t === '0') return false;
                    if (str_starts_with($t, 'data:image')) return true;
                    if (filter_var($t, FILTER_VALIDATE_URL)) return true;
                    return true; // texto no vacío
                }
                if (is_numeric($valor)) return ((float)$valor) != 0.0;
                if (is_array($valor)) {
                    // Caso temperatura {min,max,valor}
                    if (isset($valor['min']) || isset($valor['max']) || isset($valor['valor'])) {
                        foreach (['min','max','valor'] as $k) {
                            if (array_key_exists($k, $valor) && !$isEmptyish($valor[$k])) return true;
                        }
                        return false;
                    }
                    // Cualquier lista con al menos un elemento no vacío
                    foreach ($valor as $v) if (!$isEmptyish(is_scalar($v)?$v:json_encode($v,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES))) return true;
                    return false;
                }
                return true;
            };

            // ===== Tu render previo intacto =====
            $renderValor = function ($valor) {
                if ($valor === null || $valor === '') return '<span class="data-label">—</span>';
                if (is_bool($valor))   return '<span class="data-label">'.($valor?'Sí':'No').'</span>';
                if (is_numeric($valor))return '<span class="data-label">'.e($valor).'</span>';
                if (is_string($valor)) {
                    if (str_starts_with($valor, 'data:image')) return '<img src="'.e($valor).'" alt="Evidencia" class="evidence-img">';
                    if (filter_var($valor, FILTER_VALIDATE_URL)) {
                        $lower = strtolower($valor);
                        if (preg_match('/\.(png|jpe?g|webp|gif)$/', $lower)) return '<img src="'.e($valor).'" alt="Evidencia" class="evidence-img">';
                        $label = str_ends_with($lower, '.pdf') ? 'Ver PDF' : 'Abrir enlace';
                        return '<a href="'.e($valor).'" target="_blank" rel="noopener" class="data-label">'.e($label).'</a>';
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
                        $i=0; foreach ($arr as $k => $_) { if ($k !== $i++) return false; } return true;
                    };
                    if ($isList($valor)) {
                        $html = '<span class="data-label">';
                        foreach ($valor as $v) { $html .= '• '.e(is_scalar($v)?$v:json_encode($v,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)).'<br>'; }
                        return $html.'</span>';
                    }
                    return '<code class="data-label">'.e(json_encode($valor,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)).'</code>';
                }
                return '<span class="data-label">'.e((string)$valor).'</span>';
            };

            $normalize = function ($v) {
                $s = is_string($v) ? strip_tags($v) : ''; $s = trim(mb_strtolower($s));
                $s = preg_replace('/\s+/u',' ',$s); $t = @iconv('UTF-8','ASCII//TRANSLIT',$s);
                return $t !== false ? $t : $s;
            };

            $stageOrderById = collect($stages ?? [])->values()->mapWithKeys(fn($s,$i)=>[$s->id=>$i]);
            $stageOrderByLabel = collect($stages ?? [])->values()->mapWithKeys(function($s,$i) use($normalize){ $label = $s->description ?? 'Etapa '.$s->id; return [$normalize($label)=>$i]; });

            $acts = collect($actividadesEjecutadas ?? [])->unique('id')->values();
            $grouped = $acts->map(function($a) use($normalize){
                    $sid = $a['fases_fk'] ?? ($a['stage_id'] ?? ($a['id_stage'] ?? ($a['stage'] ?? null)));
                    $labelKey = $normalize($a['description_fase'] ?? '');
                    $key = $sid ? 'id:'.$sid : 'label:'.$labelKey;
                    $forms = $a['forms'] ?? [];
                    if (is_string($forms)) { $dec = json_decode($forms,true); $forms = is_array($dec) ? $dec : []; }
                    $a['forms'] = is_array($forms) ? array_values($forms) : [];
                    return ['key'=>$key,'raw'=>$a];
                })
                ->groupBy('key')
                ->map(function($bucket){
                    $first = $bucket->first()['raw'];
                    $allForms = []; $minCreated = null; $minId = PHP_INT_MAX;
                    foreach ($bucket as $item) {
                        $raw = $item['raw']; $forms = $raw['forms'] ?? [];
                        if (is_array($forms)) foreach ($forms as $f) if (is_array($f) && (!empty($f['descripcion_activitie']) || !empty($f['valor']))) $allForms[] = $f;
                        $created = $raw['created_at'] ?? null;
                        $ts = null; try { $ts = $created ? \Carbon\Carbon::parse($created)->timestamp : null; } catch (\Throwable $e) {}
                        if ($minCreated === null || ($ts !== null && $ts < $minCreated)) $minCreated = $ts;
                        $idVal = isset($raw['id']) ? (int)$raw['id'] : PHP_INT_MAX; if ($idVal < $minId) $minId = $idVal;
                    }
                    $first['forms'] = $allForms; $first['_min_created'] = $minCreated ?? 0; $first['_min_id'] = $minId;
                    if (empty($first['description_fase'])) $first['description_fase'] = '—';
                    return $first;
                });

            $actsSorted = $grouped->sortBy(function($a) use($stageOrderById,$stageOrderByLabel,$normalize){
                    $sid = $a['fases_fk'] ?? ($a['stage_id'] ?? ($a['id_stage'] ?? ($a['stage'] ?? null)));
                    $rank = PHP_INT_MAX;
                    if ($sid !== null && $sid !== '' && isset($stageOrderById[$sid])) $rank = $stageOrderById[$sid];
                    else {
                        $key = $normalize($a['description_fase'] ?? ''); if ($key !== '' && isset($stageOrderByLabel[$key])) $rank = $stageOrderByLabel[$key];
                    }
                    $minCreated = (int) ($a['_min_created'] ?? 0); $minId = (int) ($a['_min_id'] ?? 0);
                    return $rank * 1000000000 + $minCreated * 1000 + $minId;
                })->values();

            $byVersion = $actsSorted->groupBy(function ($a) { $v = $a['version'] ?? null; return $v !== null && $v !== '' ? $v : 'Inicial'; });
            $orderedVersionKeys = $byVersion->map(function ($items) { $minCreated = collect($items)->min('_min_created') ?? 0; $minId = collect($items)->min('_min_id') ?? 0; return ['rank' => $minCreated * 1000 + $minId]; })->sortBy('rank')->keys()->values();

            $splitValor = function ($valor, $maxChars = 380, $maxListItems = 8) use ($renderValor) {
                if (is_string($valor)) {
                    if (str_starts_with($valor, 'data:image') || filter_var($valor, FILTER_VALIDATE_URL)) return [ $renderValor($valor) ];
                }
                if (is_array($valor) && (isset($valor['min']) || isset($valor['max']) || isset($valor['valor']))) return [ $renderValor($valor) ];
                if (is_array($valor)) {
                    $chunks = array_chunk(array_values($valor), $maxListItems);
                    return array_map(function ($chunk) {
                        $html = '<span class="data-label">';
                        foreach ($chunk as $v) $html .= '• '.e(is_scalar($v)?$v:json_encode($v,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)).'<br>';
                        return $html.'</span>';
                    }, $chunks);
                }
                $text = trim((string)$valor);
                if ($text === '') return [ '<span class="data-label">—</span>' ];
                $parts = [];
                while (mb_strlen($text) > $maxChars) {
                    $slice = mb_substr($text, 0, $maxChars);
                    $cut   = mb_strrpos($slice, ' '); if ($cut === false) $cut = $maxChars;
                    $parts[] = '<span class="data-label">'.e(mb_substr($text, 0, $cut)).'</span>';
                    $text    = ltrim(mb_substr($text, $cut));
                }
                $parts[] = '<span class="data-label">'.e($text).'</span>';
                return $parts;
            };
        @endphp

        {{-- Render por versión --}}
        @foreach ($orderedVersionKeys as $vIndex => $versionKey)
            @php
                /** @var \Illuminate\Support\Collection $bucket */
                $bucket = $byVersion->get($versionKey);
                $tituloVersion = $vIndex === 0 ? 'Versión inicial' : 'Versión ' . $vIndex;
            @endphp

            <div class="op-version">
                <h3 class="op-version-title">
                    {{ $tituloVersion }} <span class="op-version-code">{{ $versionKey }}</span>
                </h3>

                {{-- Actividades dentro de la versión --}}
                @foreach ($bucket as $localIndex => $actividad)
                    @php
                        $forms = $actividad['forms'] ?? [];

                        // ===== NUEVO: decidir visibilidad de columnas por actividad =====
                        $showResultado = false;
                        $showLinea     = false;
                        $showUser      = false;
                        $showHora      = false;

                        foreach ($forms as $f) {
                            $val = $f['valor'] ?? null;
                            if ($hasMeaningfulValor($val)) $showResultado = true;

                            $lin = $f['linea'] ?? null;
                            if (!$isEmptyish($lin)) $showLinea = true;

                            $hrRaw = $f['created_at'] ?? ($actividad['created_at'] ?? null);
                            if ($fmtDateTime($hrRaw) !== '—') $showHora = true;
                        }
                        $userRaw = isset($actividad['user']) ? urldecode($actividad['user']) : null;
                        if (!$isEmptyish($userRaw)) $showUser = true;

                        // chunking visual
                        $imgCount = collect($forms)->where(fn($f) => is_string($f['valor'] ?? null) && str_starts_with($f['valor'], 'data:image'))->count();
                        $chunkSize = $imgCount >= 4 ? 8 : ($imgCount >= 2 ? 10 : 12);
                        $formsChunks = array_chunk($forms, $chunkSize);
                        $firstChunk = $formsChunks ? array_shift($formsChunks) : [];
                    @endphp

                    @if (!empty($firstChunk))
                        <h4 class="op-title keep-title-only">{{ $localIndex + 1 }}. {{ $actividad['description_fase'] ?? '—' }}</h4>
                        <table class="table table-striped op-table">
                            <thead>
                                <tr>
                                    <th style="width:30%">Actividad</th>
                                    @if($showResultado)<th style="width:25%">Resultado</th>@endif
                                    @if($showLinea)    <th style="width:15%">Línea</th>@endif
                                    @if($showUser)     <th style="width:15%">Usuario</th>@endif
                                    @if($showHora)     <th style="width:15%">Fecha/Hora</th>@endif
                                </tr>
                            </thead>
                            <tbody>
                                @foreach ($firstChunk as $form)
                                    @php
                                        $desc = $form['descripcion_activitie'] ?? ($form['description'] ?? '—');
                                        $valor = $form['valor'] ?? null;
                                        $linea = $form['linea'] ?? '—';
                                        $user  = isset($actividad['user']) ? urldecode($actividad['user']) : '—';
                                        $fechaHora = $fmtDateTime($form['created_at'] ?? ($actividad['created_at'] ?? null));
                                        $frags = $splitValor($valor);
                                    @endphp
                                    @foreach ($frags as $i => $fragHtml)
                                    <tr>
                                        <td>{{ $i ? '↳ '.$desc.' (cont.)' : $desc }}</td>
                                        @if($showResultado)<td>{!! $fragHtml !!}</td>@endif
                                        @if($showLinea)    <td>{{ $i ? '—' : $linea }}</td>@endif
                                        @if($showUser)     <td>{{ $i ? '—' : $user }}</td>@endif
                                        @if($showHora)     <td>{{ $i ? '—' : $fechaHora }}</td>@endif
                                    </tr>
                                    @endforeach
                                @endforeach
                            </tbody>
                        </table>

                        @foreach ($formsChunks as $chunk)
                            <table class="table table-striped op-table">
                                <thead>
                                    <tr>
                                        <th style="width:30%">Actividad</th>
                                        @if($showResultado)<th style="width:25%">Resultado</th>@endif
                                        @if($showLinea)    <th style="width:15%">Línea</th>@endif
                                        @if($showUser)     <th style="width:15%">Usuario</th>@endif
                                        @if($showHora)     <th style="width:15%">Fecha/Hora</th>@endif
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach ($chunk as $form)
                                        @php
                                            $desc = $form['descripcion_activitie'] ?? ($form['description'] ?? '—');
                                            $valor = $form['valor'] ?? null;
                                            $linea = $form['linea'] ?? '—';
                                            $user  = isset($actividad['user']) ? urldecode($actividad['user']) : '—';
                                            $fechaHora = $fmtDateTime($form['created_at'] ?? ($actividad['created_at'] ?? null));
                                            $frags = $splitValor($valor);
                                        @endphp
                                        @foreach ($frags as $i => $fragHtml)
                                        <tr>
                                            <td>{{ $i ? '↳ '.$desc.' (cont.)' : $desc }}</td>
                                            @if($showResultado)<td>{!! $fragHtml !!}</td>@endif
                                            @if($showLinea)    <td>{{ $i ? '—' : $linea }}</td>@endif
                                            @if($showUser)     <td>{{ $i ? '—' : $user }}</td>@endif
                                            @if($showHora)     <td>{{ $i ? '—' : $fechaHora }}</td>@endif
                                        </tr>
                                        @endforeach
                                    @endforeach
                                </tbody>
                            </table>
                        @endforeach
                    @endif
                @endforeach
            </div>
        @endforeach

        {{-- ===== Usuarios ===== --}}
        @php
            $userNames = ($users instanceof \Illuminate\Support\Collection ? $users : collect($users ?? []))
                ->map(fn($u) => is_array($u) ? ($u['name'] ?? null) : ($u->name ?? null))
                ->filter()
                ->map(fn($n) => urldecode(preg_replace('/[\r\n]+/','', $n)))
                ->unique()
                ->values();
        @endphp

        <h2 class="section-title keep-title-only">Personal Encargado</h2>
        <div>
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th style="width:26%"></th>
                        <th>Personal Asignados</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Personal</td>
                        <td>{{ $userNames->implode(', ') ?: '—' }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

         {{-- ===== Testigos (Firmas) ===== --}} 
        
        @php 
            use Carbon\Carbon;

            $testigoTables = [];

            if (isset($controlGroups) && is_iterable($controlGroups) && count($controlGroups)) {
                $onlyTestigos = [];

                foreach ($controlGroups as $g) {
                    if (($g['source'] ?? null) !== 'testigos') continue;

                    $rows = isset($g['registros']) && is_array($g['registros']) ? array_values($g['registros']) : [];
                    if (!count($rows)) continue;

                    $fase     = $g['fase'] ?? 'TESTIGO';
                    $userNm   = $g['user'] ?? '—';
                    $fechaSrc = $g['updated_at'] ?? $g['created_at'] ?? null;

                    if ($fechaSrc instanceof \Carbon\Carbon) {
                        $fecha = $fechaSrc->format('Y-m-d H:i');
                    } else {
                        $fecha = $fechaSrc ? Carbon::parse($fechaSrc)->format('Y-m-d H:i') : '—';
                    }

                    foreach ($rows as $r) {
                        $onlyTestigos[] = [
                            'fase'        => $fase,
                            'descripcion' => $r['descripcion'] ?? '—',
                            'valor'       => $r['valor'] ?? null,
                            'unidad'      => $r['unidad'] ?? null,
                            'tipo'        => $r['tipo'] ?? null,
                            'user'        => $userNm,
                            'fecha'       => $fecha,
                        ];
                    }
                }

                // Fallback: usar $testigos del backend si no hubo nada
                if (!count($onlyTestigos) && isset($testigos) && is_iterable($testigos)) {
                    foreach ($testigos as $t) {
                        $fase     = $t['descripcion'] ?? 'TESTIGO';
                        $userNm   = $t['user'] ?? '—';
                        $fechaSrc = $t['updated_at'] ?? $t['created_at'] ?? null;

                        if ($fechaSrc instanceof \Carbon\Carbon) {
                            $fecha = $fechaSrc->format('Y-m-d H:i');
                        } else {
                            $fecha = $fechaSrc ? Carbon::parse($fechaSrc)->format('Y-m-d H:i') : '—';
                        }

                        $regs = isset($t['registros']) && is_array($t['registros']) ? $t['registros'] : [];
                        foreach ($regs as $r) {
                            $onlyTestigos[] = [
                                'fase'        => $fase,
                                'descripcion' => $r['descripcion'] ?? '—',
                                'valor'       => $r['valor'] ?? null,
                                'unidad'      => $r['unidad'] ?? null,
                                'tipo'        => $r['tipo'] ?? null,
                                'user'        => $userNm,
                                'fecha'       => $fecha,
                            ];
                        }
                    }
                }

                // Partir en tablas de 6 filas
                if (count($onlyTestigos)) {
                    foreach (array_chunk($onlyTestigos, 6) as $chunk) {
                        $testigoTables[] = ['rows' => $chunk];
                    }
                }
            }
        @endphp

        @if (count($testigoTables))
            <h2 class="section-title keep-title-only">Testigos (Firmas)</h2>
            <div class="tabla-container">
                @foreach ($testigoTables as $tbl)
                    <div class="tabla-item">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th style="width:30%">Actividad</th>
                                    <th style="width:34%">Firma / Valor</th>
                                    <th style="width:18%">Usuario</th>
                                    <th style="width:18%">Fecha y Hora</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach ($tbl['rows'] as $row)
                                    @php
                                        $desc      = $row['descripcion'] ?? '—';
                                        $valorRaw  = $row['valor'] ?? null;
                                        $unidad    = $row['unidad'] ?? null;
                                        $user      = isset($row['user']) ? urldecode($row['user']) : '—';
                                        $fecha     = $row['fecha'] ?? '—';

                                        // Texto mostrable
                                        $textValue = is_scalar($valorRaw) ? trim((string) $valorRaw) : null;

                                        // === Detección/validación de imagen segura para Dompdf ===
                                        $imgSrc = null;          // puede ser data URI, file path o URL
                                        $imgIsRemote = false;    // para links, opcional

                                        if (is_string($valorRaw) && strlen(trim($valorRaw))) {
                                            $val = trim($valorRaw);

                                            // 1) data:image... (validar base64)
                                            if (str_starts_with($val, 'data:image')) {
                                                $comma = strpos($val, ',');
                                                $b64   = $comma !== false ? substr($val, $comma + 1) : '';
                                                $bin   = base64_decode($b64, true);

                                                if ($bin !== false && function_exists('getimagesizefromstring') && @getimagesizefromstring($bin)) {
                                                    $imgSrc = $val; // data URI válida
                                                }
                                            } else {
                                                // 2) URL o ruta con extensión de imagen
                                                $pathOnly = parse_url($val, PHP_URL_PATH) ?? $val;

                                                if (preg_match('/\.(png|jpe?g|gif|webp|svg)$/i', $pathOnly)) {
                                                    if (filter_var($val, FILTER_VALIDATE_URL)) {
                                                        // URL remota (Dompdf requiere isRemoteEnabled=true)
                                                        $imgSrc = $val;
                                                        $imgIsRemote = true;
                                                    } else {
                                                        // Ruta local relativa: validar existencias y usar **filesystem path** para Dompdf
                                                        $rel  = ltrim($val, '/');                // e.g. storage/firmas/abc.png
                                                        $full = public_path($rel);               // /public/...
                                                        if (file_exists($full)) {
                                                            $imgSrc = $full;
                                                        } else {
                                                            // Si viene /storage pero no hay symlink, mapear a storage/app/public
                                                            if (str_starts_with($rel, 'storage/')) {
                                                                $altFull = storage_path('app/public/' . substr($rel, 8));
                                                                if (file_exists($altFull)) {
                                                                    $imgSrc = $altFull;
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                                // 3) Base64 sin prefijo (validar)
                                                if (!$imgSrc) {
                                                    $clean = preg_replace('/\s+/', '', $val);
                                                    $bin   = base64_decode($clean, true);
                                                    if ($bin !== false && function_exists('getimagesizefromstring') && @getimagesizefromstring($bin)) {
                                                        $imgSrc = 'data:image/png;base64,' . $clean; // asumimos PNG
                                                    }
                                                }
                                            }
                                        }

                                        // Normalizar src para Dompdf: file path -> file://...
                                        $imgHtmlSrc = null;
                                        if ($imgSrc) {
                                            if (preg_match('~^https?://|^data:image~i', $imgSrc)) {
                                                $imgHtmlSrc = $imgSrc;
                                            } else {
                                                // Asumimos ruta absoluta del filesystem
                                                $imgHtmlSrc = 'file://' . $imgSrc;
                                            }
                                        }
                                    @endphp
                                    <tr>
                                        <td>{{ $desc }}</td>
                                        <td>
                                            <div class="firma-cell" style="display:flex; flex-direction:column; gap:6px;">
                                                {{-- Imagen SOLO si fue validada --}}
                                                @if ($imgHtmlSrc)
                                                    <img src="{{ $imgHtmlSrc }}" alt="Firma" class="evidence-img" style="max-height:64px; max-width:100%; object-fit:contain;" />
                                                    @if ($imgIsRemote)
                                                        <a href="{{ $imgSrc }}" target="_blank" rel="noopener" class="data-label">Abrir imagen</a>
                                                    @endif
                                                @endif

                                                {{-- Mostrar SIEMPRE el texto si existe --}}
                                                @if (is_string($textValue) && strlen($textValue))
                                                    <span class="data-label">
                                                        {{ $textValue }}@if ($unidad) <small> {{ $unidad }}</small>@endif
                                                    </span>
                                                @elseif (!$imgHtmlSrc)
                                                    <span class="data-label">—</span>
                                                @endif
                                            </div>
                                        </td>
                                        <td>{{ $user }}</td>
                                        <td>{{ $fecha }}</td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                @endforeach
            </div>
        @endif

        {{-- ===== Controles de Proceso ===== --}}
        <h2 class="section-title controls-title keep-title-only">Controles de Proceso</h2>
        @php 
             // Helper de fecha/hora: DD/MM/YYYY - HH:mm (con TZ de la app o Bogotá)
            $fmtDateTime = function ($ts, $tz = null) {
                try {
                    if (!$ts) return '—';
                    $tz = $tz ?? (config('app.timezone') ?: 'America/Bogota');

                    if ($ts instanceof \Carbon\CarbonInterface) {
                        $dt = $ts->copy()->setTimezone($tz);
                    } else {
                        $dt = \Carbon\Carbon::parse($ts)->setTimezone($tz);
                    }
                    return $dt->format('d/m/Y - H:i');
                } catch (\Throwable $e) {
                    return '—';
                }
            };

            $controlTables = [];

            // 1) Preferir la lista unificada del backend (timers + actividades_controls normalizados)
            if (isset($controlGroups) && is_iterable($controlGroups) && count($controlGroups)) {
                foreach ($controlGroups as $group) {
                    $rows = isset($group['registros']) && is_array($group['registros']) ? array_values($group['registros']) : [];
                    if (!count($rows)) continue;

                    $chunks   = array_chunk($rows, 12);
                    $userNm   = $group['user'] ?? '—';
                    $fechaSrc = $group['updated_at'] ?? $group['created_at'] ?? null;
                    $fecha    = $fmtDateTime($fechaSrc);

                    foreach ($chunks as $chunk) {
                        $controlTables[] = [
                            'rows'  => $chunk,
                            'user'  => $userNm,
                            'fecha' => $fecha,
                        ];
                    }
                }
            }

            // 2) Fallback: legacy timers (por si aún no usas controlGroups)
            if (!count($controlTables) && isset($timers) && is_iterable($timers)) {
                foreach ($timers as $timer) {
                    foreach ($timer->timerControls as $control) {
                        // data puede venir como string JSON o como array
                        $data = $control->data;
                        if (is_string($data)) {
                            $decoded = json_decode($data, true);
                            $rows = is_array($decoded) ? array_values($decoded) : [];
                        } else {
                            $rows = is_array($data) ? array_values($data) : [];
                        }

                        if (!count($rows)) continue;

                        $chunks = array_chunk($rows, 12);
                        $userNm = is_object($control->user ?? null) ? ($control->user->name ?? '—') : ($control->user ?? '—');
                        $fecha  = $fmtDateTime($control->created_at);

                        foreach ($chunks as $chunk) {
                            $controlTables[] = [
                                'rows'  => $chunk,
                                'user'  => $userNm,
                                'fecha' => $fecha,
                            ];
                        }
                    }
                }
            }

            // 3) Fallback: ActividadesControls normalizados del backend (si no usaste controlGroups)
            if (!count($controlTables) && isset($actividadesControls) && is_iterable($actividadesControls)) {
                foreach ($actividadesControls as $ac) {
                    $rows = isset($ac['registros']) && is_array($ac['registros']) ? array_values($ac['registros']) : [];
                    if (!count($rows)) continue;

                    $chunks   = array_chunk($rows, 12);
                    $userNm   = $ac['user'] ?? '—';
                    $fechaSrc = $ac['updated_at'] ?? $ac['created_at'] ?? null;
                    $fecha    = $fmtDateTime($fechaSrc);

                    foreach ($chunks as $chunk) {
                        $controlTables[] = [
                            'rows'  => $chunk,
                            'user'  => $userNm,
                            'fecha' => $fecha,
                        ];
                    }
                }
            }
        @endphp

        @if (count($controlTables))
            <div class="tabla-container">
                @foreach ($controlTables as $tbl)
                    <div class="tabla-item">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th style="width:26%">Descripción</th>
                                    <th style="width:36%">Resultado</th>
                                    <th style="width:20%">Usuario</th>
                                    <th style="width:18%">Fecha - Hora</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach ($tbl['rows'] as $item)
                                    @php
                                        $desc   = $item['descripcion'] ?? ($item['description'] ?? '—');
                                        $valor  = $item['valor'] ?? null;
                                        $isImg  = is_string($valor) && str_starts_with($valor, 'data:image');
                                        $isArr  = is_array($valor);
                                        $isTemp = $isArr && isset($valor['min'], $valor['max'], $valor['valor']);
                                    @endphp
                                    <tr>
                                        <td>{{ $desc }}</td>
                                        <td>
                                            @if ($isImg)
                                                <img src="{{ $valor }}" alt="Evidencia" class="evidence-img" />
                                            @elseif ($isTemp)
                                                <div class="data-label">
                                                    Min: {{ $valor['min'] }} |
                                                    Máx: {{ $valor['max'] }} |
                                                    Medido: <strong>{{ $valor['valor'] }}</strong>
                                                </div>
                                            @elseif ($isArr)
                                                <span class="data-label">{{ json_encode($valor, JSON_UNESCAPED_UNICODE) }}</span>
                                            @else
                                                <span class="data-label">{{ $valor ?? '—' }}</span>
                                            @endif
                                        </td>
                                        <td>{{ $tbl['user'] }}</td>
                                        <td>{{ $tbl['fecha'] }}</td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                @endforeach
            </div>
        @endif
    </div> 

    <!-- ===== FOOTER FIJO + PAGINADO ===== -->
    <script type="text/php">
if (isset($pdf)) {
  $font = $fontMetrics->get_font("DejaVu Sans", "normal");
  $size = 8;
  $y = $pdf->get_height() - 30;
  $gray = [107/255,114/255,128/255];

  $left  = "Documento generado automáticamente – Pharex S.A. | Confidencial";
  $right = "Página {PAGE_NUM} de {PAGE_COUNT}";
  $full  = $left . "  |  " . $right;

  $LEFT_MARGIN = 100; $RIGHT_MARGIN = 0;
  $usable_width = $pdf->get_width() - $LEFT_MARGIN - $RIGHT_MARGIN;
  $w = $fontMetrics->get_text_width($full, $font, $size);
  $x = $LEFT_MARGIN + max(0, ($usable_width - $w) / 2);

  $pdf->page_text($x, $y, $full, $font, $size, $gray);
}
</script>
</body>
</html>
