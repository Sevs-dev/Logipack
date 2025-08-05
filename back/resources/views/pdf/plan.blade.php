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
            color: #374151;
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

        /* Tabla general */
        .table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0 24px;
            font-size: 11.5px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            border-radius: 6px;
            overflow: hidden;
        }

        .table th {
            background-color: #eff6ff;
            color: #1e40af;
            font-weight: 600;
            padding: 8px 10px;
            text-align: center;
            border-bottom: 1px solid #bfdbfe;
            word-break: break-word;
            white-space: normal;
            overflow-wrap: anywhere;
        }

        .table td {
            padding: 8px 10px;
            text-align: center;
            border-bottom: 1px solid #e0e7ff;
            background-color: #ffffff;
            word-break: break-word;
            white-space: normal;
            overflow-wrap: anywhere;
        } 
        
        .table td,
        .table th {
            word-break: break-word;
            white-space: normal;
            overflow-wrap: anywhere;
        }

        .table tr:nth-child(even) {
            background-color: #f8fafc;
        }

        .table tr:last-child td {
            border-bottom: none;
        }

        /* Tabla con rayas */
        .table-striped tbody tr:nth-child(odd) {
            background-color: #f1f5f9;
        }

        .table-striped tbody tr:hover {
            background-color: #e0f2fe;
            transition: background-color 0.2s ease;
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
            max-width: 60px;
            max-height: 40px;
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
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            opacity: 0.08;
            pointer-events: none;
            z-index: 0;
            width: 280px;
            filter: grayscale(100%);
        }

        /* Celdas con datos especiales */
        .data-label {
            font-weight: 500;
            color: #4b5563;
        }

        /* ===== Diagrama Snake (HTML + CSS, sin SVG) ===== */
        /* ===== Diagrama Snake Corregido ===== */
        .diagram {
            max-width: 744px;
            margin: 16px auto;
            page-break-inside: avoid;
        }

        .diagram .row {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            margin: 6px 0;
        }

        .diagram .row.reverse {
            flex-direction: row-reverse;
        }

        .diagram .node {
            width: 170px;
            min-height: 70px;
            background: #ffffff;
            border: 2px solid #3b82f6;
            border-radius: 12px;
            padding: 10px 8px;
            text-align: center;
            position: relative;
            line-height: 1.3;
            word-break: break-word;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        }

        .diagram .node .badge {
            position: absolute;
            top: -12px;
            left: 10px;
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            color: #1e40af;
            border-radius: 8px;
            padding: 1px 6px;
            font-size: 10px;
            font-weight: 600;
        }

        .diagram .node .label {
            font-size: 11.5px;
            color: #1e3a8a;
            margin-top: 4px;
        }

        .diagram .arrow-h {
            width: 40px;
            height: 2px;
            background: #3b82f6;
            position: relative;
            flex-shrink: 0;
        }

        .diagram .arrow-h::after {
            content: "";
            position: absolute;
            top: -5px;
            right: 0;
            border-top: 6px solid transparent;
            border-bottom: 6px solid transparent;
            border-left: 8px solid #3b82f6;
        }

        .diagram .arrow-h.reverse {
            transform: rotate(180deg);
        }

        .diagram .arrow-v {
            width: 2px;
            height: 40px;
            background: #3b82f6;
            position: relative;
        }

        .diagram .arrow-v::after {
            content: "";
            position: absolute;
            left: -6px;
            bottom: -1px;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 8px solid #3b82f6;
        }

        /* Espaciadores para alinear flecha vertical */
        .diagram .handoff-row {
            display: flex;
            justify-content: center;
            align-items: flex-start;
            gap: 16px;
            margin: -20px 0 10px;
            /* ajuste visual */
        }

        .diagram .ph-node {
            width: 170px;
            height: 0;
            flex: 0 0 170px;
        }

        .diagram .ph-arrow {
            width: 40px;
            height: 0;
            flex: 0 0 40px;
        }
    </style>
</head>

<body>

    {{-- ✅ Marca de agua --}}
    @php
        $path = public_path('images/pharex.png');
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

        {{-- ===== Diagrama Snake (HTML+CSS) ===== --}}
        <h2>Diagrama de Operaciones a Realizar</h2>
        @php
            $stagesArr = collect($stages ?? [])
                ->map(function ($s) {
                    $label = $s->description ?? 'Etapa ' . $s->id;
                    $label = trim(strip_tags((string) $label));
                    return ['id' => $s->id, 'label' => $label ?: 'Etapa ' . ($s->id ?? '?')];
                })
                ->values()
                ->toArray();

            $NODES_PER_ROW = 3;
            $chunks = array_chunk($stagesArr, $NODES_PER_ROW);
        @endphp

        @if (count($stagesArr))
            <div class="diagram" style="margin:16px auto; text-align:center; font-size:11px;">
                @php $processedSoFar = 0; @endphp

                @foreach ($chunks as $chunkIndex => $row)
                    @php
                        $isReverse = $chunkIndex % 2 !== 0;
                        $itemsInRow = count($row);
                        $cellWidth = number_format(100 / $NODES_PER_ROW, 2);
                        $arrowWidth =
                            $itemsInRow > 1
                                ? number_format((100 - $cellWidth * $itemsInRow) / ($itemsInRow - 1), 2)
                                : 0;
                        $rowStartIndex = $processedSoFar + 1;
                    @endphp

                    <!-- Fila de nodos -->
                    <table style="width:100%; border-collapse:collapse; margin:10px 0;" role="presentation">
                        <tr>
                            @foreach ($row as $colIndex => $stage)
                                @php
                                    $ordinalInRow = $isReverse ? $itemsInRow - 1 - $colIndex : $colIndex;
                                    $displayIndex = $rowStartIndex + $ordinalInRow;
                                    $isVisualEnd = $isReverse ? $colIndex === 0 : $colIndex === $itemsInRow - 1;
                                @endphp

                                <td style="width: {{ $cellWidth }}%; padding:2px; vertical-align:top;">
                                    <div
                                        style="
                                width:100%; min-height:50px; max-width:150px; margin:0 auto;
                                background:#fff; border:2px solid #3b82f6; border-radius:8px;
                                padding:6px 4px; text-align:center; line-height:1.3; word-break:break-word;
                                position:relative; box-shadow:0 1px 2px rgba(0,0,0,0.06); font-size:11px;
                            ">
                                        <span
                                            style="
                                    position:absolute; top:-10px; left:8px;
                                    background:#eff6ff; border:1px solid #bfdbfe; color:#1e40af;
                                    border-radius:6px; padding:1px 5px; font-size:9px; font-weight:600;
                                ">
                                            {{ $displayIndex }}
                                        </span>
                                        <div style="color:#1e3a8a;">{{ $stage['label'] }}</div>
                                    </div>
                                </td>

                                <!-- Flecha horizontal -->
                                @if (!$isVisualEnd)
                                    <td style="width: {{ $arrowWidth }}%; padding:2px; text-align:center;">
                                        <div
                                            style="
                                    width:30px; height:1.5px; background:#3b82f6; margin:24px auto; position:relative;
                                ">
                                            <div
                                                style="
                                        content:''; position:absolute; top:-4px;
                                        {{ $isReverse ? 'left:0;' : 'right:0;' }}
                                        border-top:5px solid transparent; border-bottom:5px solid transparent;
                                        {{ $isReverse ? 'border-right:6px solid #3b82f6;' : 'border-left:6px solid #3b82f6;' }}
                                    ">
                                            </div>
                                        </div>
                                    </td>
                                @endif
                            @endforeach
                        </tr>
                    </table>

                    <!-- Flecha vertical (baja del extremo visual de la fila) -->
                    @if ($chunkIndex < count($chunks) - 1)
                        @php
                            $extremePos = $isReverse ? 0 : $itemsInRow - 1;
                            $leftPos = $extremePos * $cellWidth + $cellWidth / 2;
                        @endphp
                        <div style="text-align:center; margin:10px 0 6px;">
                            <div
                                style="
                        display:inline-block; width:1.5px; height:30px; background:#3b82f6;
                        margin-left: {{ $leftPos }}%; position:relative; transform:translateX(-50%);
                    ">
                                <div
                                    style="
                            content:''; position:absolute; left:-5px; bottom:-2px;
                            border-left:5px solid transparent; border-right:5px solid transparent;
                            border-top:7px solid #3b82f6;
                        ">
                                </div>
                            </div>
                        </div>
                    @endif

                    @php $processedSoFar += $itemsInRow; @endphp
                @endforeach
            </div>
        @else
            <p style="text-align:center; color:#6b7280; font-size:11px; margin:12px 0;">
                No hay etapas para mostrar en el diagrama.
            </p>
        @endif

        {{-- ===== Fin Diagrama ===== --}}
        <table class="table">
            <tr>
                <th style="width: 15%">Receta validada por</th>
                <td style="width: 35%">{{ $plan->user }}</td>
                <th style="width: 15%">Cliente</th>
                <td style="width: 35%">{{ $cliente->updated_at ?? '—' }}</td>
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
                                    @if (isset($form['valor']) && str_starts_with($form['valor'], 'data:image'))
                                        <img src="{{ $form['valor'] }}" alt="Evidencia" class="evidence-img">
                                    @else
                                        <span class="data-label">{{ $form['valor'] ?? '—' }}</span>
                                    @endif
                                </td>
                                <td>{{ $form['linea'] ?? '—' }}</td>
                                <td>{{ $actividad['user'] ?? '—' }}</td>
                                <td>{{ \Carbon\Carbon::parse($actividad['created_at'])->format('H:i') }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        @endforeach

        <h2>Máquinas Utilizadas</h2>
        <ul>
            @forelse ($machines as $machine)
                <li>{{ $machine->name }}</li>
            @empty
                <li><em>No se registraron máquinas.</em></li>
            @endforelse
        </ul>

        <h2>Usuarios Involucrados</h2>
        <ul>
            @forelse ($users as $user)
                <li>{{ $user->name }}</li>
            @empty
                <li><em>No se registraron usuarios.</em></li>
            @endforelse
        </ul>

        <h2>Controles de Proceso</h2>

        @forelse ($timers as $timer)
            @forelse ($timer->timerControls as $control)
                @php
                    $rows = is_array($control->data) ? $control->data : [];
                @endphp

                @if (count($rows))
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th style="width: 35%">Descripción</th>
                                <th style="width: 35%">Resultado</th>
                                <th style="width: 15%">Usuario</th>
                                <th style="width: 15%">Fecha y Hora</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($rows as $item)
                                @php
                                    $desc = $item['descripcion'] ?? ($item['description'] ?? '—');
                                    $valor = $item['valor'] ?? null;

                                    $isImg = is_string($valor) && str_starts_with($valor, 'data:image');
                                    $isArray = is_array($valor);

                                    // Caso especial: temperatura { min, max, valor }
                                    $isTemp =
                                        is_array($valor) &&
                                        array_key_exists('min', $valor) &&
                                        array_key_exists('max', $valor) &&
                                        array_key_exists('valor', $valor);
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
                                        @elseif ($isArray)
                                            <span
                                                class="data-label">{{ json_encode($valor, JSON_UNESCAPED_UNICODE) }}</span>
                                        @else
                                            <span class="data-label">{{ $valor ?? '—' }}</span>
                                        @endif
                                    </td>
                                    <td>{{ $control->user->name ?? ($control->user ?? '—') }}</td>
                                    <td>{{ \Carbon\Carbon::parse($control->created_at)->format('Y-m-d H:i') }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                @endif
            @empty
                {{-- sin controles en este timer --}}
            @endforelse
        @empty
            <p style="text-align:center; color:#6b7280; font-size:11px; margin:12px 0;">
                No hay controles de proceso registrados.
            </p>
        @endforelse

        <footer>
            Documento generado automáticamente – Pharex S.A. | Confidencial
        </footer>
    </div>
</body>

</html>
