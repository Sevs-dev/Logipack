<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Batch Record - Orden {{ $plan->number_order }}</title>
  <style>
    /* ===== PÁGINA / TIPOGRAFÍA / RESETEOS ===== */
    @page {
      margin: 60px 48px 72px 48px; /* más compacto y con espacio para footer */
    }

    * { box-sizing: border-box; }

    body {
      font-family: 'Segoe UI','Helvetica Neue',Arial,sans-serif;
      font-size: 12px;
      line-height: 1.35;                   /* más compacto */
      color: #111827;
      background: #fff;
      margin: 0;
      padding: 0;
    }

    .content {
      position: relative;
      z-index: 1;                          /* sobre la marca de agua */
      max-width: 100%;
    }

    /* ===== TITULARES ===== */
    h1 {
      text-align: center;
      font-size: 18.5px;                   /* leve ajuste */
      font-weight: 700;
      color: #1e3a8a;
      margin: 0 0 32px;
      letter-spacing: -0.3px;
      page-break-after: avoid;
    }

    /* H2 base */
    h2 {
      font-size: 10.5px;
      font-weight: 700;
      color: #0f172a;
      text-align: center;
      margin: 16px 0 8px;                  /* más pegado */
      padding-bottom: 6px;
      border-bottom: 1px solid #dbeafe;
      page-break-after: avoid;
    }
    h2.section-title { margin: 14px 0 6px; }

    h3 {
      font-size: 9px;
      font-weight: 700;
      color: #1e40af;
      margin: 12px 0 6px;                  /* compactado */
      page-break-after: avoid;
    }

    /* Mantener bloques con su título */
    .section-keep,
    .op-keep,
    .keep-with-title {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* ===== TABLAS (base compacta y consistente) ===== */
    table { width: 100%; border-collapse: collapse; table-layout: auto; border-radius: 2px}
    .table {
      margin: 4px 0 4px;                   /* menos margen vertical */ 
      font-size: 8px;                     /* levemente menor */
      border: 1px solid #1e1ef854;
      border-radius: 8px;
      page-break-inside: auto;
      break-inside: auto;
    }
    .table th,
    .table td {
      padding: 2px 2px;      
      border: 1px solid #1e1ef854;            
      vertical-align: middle;
      word-break: break-word;
      white-space: normal;
      text-align: center;
    }
    .table th {
      background: #eff6ff;
      color: #1e3a8a;
      font-weight: 500;
    }
    .table td { background: #fff; color: #374151; }
    .table tr:nth-child(even) td { background: #f9fafb; }
    .table tr:last-child td { border-bottom: none; }

    /* Rayado opcional + hover neutro (PDF no “hoverea”, pero se mantiene homogéneo) */
    .table-striped tbody tr:nth-child(odd) td { background: #fff; }
    .table-striped tbody tr:hover td { background: #fff; transition: background-color .2s ease; }

    /* Mantener filas enteras en una página */
    .table tr { page-break-inside: avoid; break-inside: avoid; }

    /* Repetición de encabezado/pie en multipágina */
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }

    /* Utilidades tabla */
    .table-centered th, .table-centered td { text-align: center; }
    .nowrap { white-space: nowrap; }
    .right { text-align: right; }

    /* ===== LISTAS ===== */
    ul { padding-left: 16px; margin: 6px 0; list-style-type: square; }
    ul li { color: #4b5563; margin-bottom: 2px; font-size: 11px; }

    /* ===== EVIDENCIAS (imágenes) ===== */
    .evidence-img {
      max-width: 100%;
      max-height: 100px;                   /* menos alta para filas compactas */
      object-fit: contain;
      border-radius: 4px;
      border: 1px solid #d1d5db;
    }

    /* ===== MARCA DE AGUA (por detrás) ===== */
    .watermark {
      position: fixed;
      top: 50%;
      left: 45%;
      transform: translate(-50%, -50%) rotate(-30deg);
      opacity: 0.07;
      pointer-events: none;
      z-index: 0;                          /* detrás del contenido */
      width: 680px;
      filter: grayscale(100%);
    }

    /* ===== DIAGRAMA SNAKE (sin cambios estructurales) ===== */
    .snake-wrap { width: 100%; }
    .snake-row { width: 100%; margin-bottom: 6px; font-size: 0; }
    .snake-cell, .snake-conn { display: inline-block; vertical-align: top; }
    .snake-cell { width: 31%; }
    .snake-conn { width: 3.5%; text-align: center; }
    .snake-card {
      border: 1px solid #e5e7eb; 
      border-radius: 8px;
      padding: 8px;
      background: #fff;
      min-height: 40px;
    }
    .snake-label{
        display:flex; align-items:center; /* centra verticalmente el label respecto al badge */
        width:100%; gap:6px; font-size:8px; color:#111827; margin-bottom:4px; font-weight:700;
    }
    .snake-badge{
        display:inline-block; min-width:18px; height:18px; line-height:16px;
        text-align:center; border-radius:50%; margin-top: 10px;
        border:1px solid #0077fe61; background:#eff6ff; color:#0044ff; font-weight:800; font-size:10.5px;
        flex:0 0 auto; /* fijo a la izquierda */
    }
    .snake-text{
        flex:1 1 auto; text-align:center; margin-left: 4px;/* centra el label en el espacio restante */
    }
    .conn-arrow { font-size: 12px; color: #1e3a8a; margin-top: 20px; white-space: nowrap; }

    /* ===== OPERACIONES EJECUTADAS ===== */
    .op-h2 { page-break-after: avoid; }
    .op-title { margin: 0 0 6px; }
    .op-table { page-break-inside: avoid; break-inside: avoid; }

    /* ===== CONTROLES DE PROCESO (2 columnas fluidas) ===== */
    .tabla-container { width: 100%; font-size: 0; }
    .tabla-item {
      display: inline-block; vertical-align: top; width: 49%;
      margin: 0 2% 10px 0; font-size: 12px; page-break-inside: avoid; break-inside: avoid;
    }
    .tabla-item:nth-child(2n) { margin-right: 0; }

    /* ===== RESUMEN CONCILIACIÓN (estilos agrupados) ===== */
    .conc-card {
      background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px;
      page-break-inside: avoid; break-inside: avoid;
    }
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
    .conc-badge.ok  { border: 1px solid #d1fae5; background: #ecfdf5; color: #065f46; }
    .conc-badge.mid { border: 1px solid #fef3c7; background: #fffbeb; color: #92400e; }
    .conc-badge.warn{ border: 1px solid #fee2e2; background: #fef2f2; color: #991b1b; }

    .data-label { font-weight: 500; color: #4b5563; }

    /* ===== FOOTER/PAGINADO (abajo-derecha) ===== */
     footer.pdf-footer{
        position: fixed;
        bottom: 22px;          /* debe ser < margin-bottom */
        left: 48px;
        right: 48px;
        font-size: 10px;
        color: #6b7280;
        display: flex;
        align-items: center;
        justify-content: flex-end;  /* número de página a la derecha */
        gap: 8px;
        border-top: 1px solid #e5e7eb;
        padding-top: 8px;
        background: #fff;      /* evita que la marca de agua lo ensucie */
        z-index: 2;            /* por encima de la marca de agua */
    }
    .pagenum::before   { content: counter(page); }
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
    <h2 class="section-title">Datos Generales</h2>
    <div class="section-keep">
      <table class="table">
        <tr>
          <th style="width:15%">Orden</th>
          <td style="width:35%">{{ $plan->number_order }}</td>
          <th style="width:15%">Cliente</th>
          <td style="width:35%">{{ $cliente->name ?? '—' }}</td>
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
          <th>F. Vencimiento</th>
          <td>{{ \Carbon\Carbon::parse($plan->end_date)->format('Y-m-d') ?? '—' }}</td>
        </tr>
        <tr>
          <th>Cantidad</th>
          <td>{{ $plan->quantityToProduce }} unidades</td>
          <th>N° de Orden Cliente</th>
          <td>{{ $plan->orderNumber }}</td>
        </tr>
      </table>
    </div>

    {{-- ===== Diagrama de Operaciones (snake) ===== --}}
    <h2 class="section-title">Diagrama de Operaciones</h2>
    @php
      $stagesArr = collect($stages ?? [])
        ->values()
        ->map(function ($s, $i) {
          $label = $s->description ?? 'Etapa ' . $s->id;
          $label = trim(strip_tags((string)$label));
          return ['id' => $s->id, 'label' => $label ?: 'Etapa ' . ($s->id ?? '?'), 'seq' => $i + 1];
        })
        ->toArray();
      $rows = array_chunk($stagesArr, 3);
      $firstRow = $rows ? array_shift($rows) : [];
    @endphp

    @if (!empty($firstRow))
      <div class="section-keep">
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
                    <span class="snake-text">{{ $stage['label'] }}</span>
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

    {{-- ===== Elaborado y Aprobado ===== --}}
    <div class="section-keep">
      <table class="table">
        <tr>
          <th style="width:12%">Elaborado:</th>
          <td style="width:38%">
            {{ $masterStages[0]['user'] ? urldecode(preg_replace('/[\r\n]+/', '', $masterStages[0]['user'])) : 'Sin usuario' }}
          </td>
          <th style="width:10%">Fecha</th>
          <td style="width:15%">{{ $cliente->updated_at ?? '—' }}</td>
        </tr>
        <tr>
          <th>Aprobado:</th>
          <td>
            {{ $plan->user ? urldecode(preg_replace('/[\r\n]+/', '', $plan->user)) : 'Sin usuario' }}
          </td>
          <th>Fecha</th>
          <td>{{ $cliente->updated_at ?? '—' }}</td>
        </tr>
      </table>
    </div>

    {{-- ===== Resumen de Conciliación ===== --}}
    @php
      $cRaw = $conciliacion ?? null;
      $c = is_array($cRaw) ? (object)$cRaw : $cRaw;
      $nf = fn($v) => $v === null || $v === '' ? '—' : number_format((float)$v, 2, ',', '.');
      $pf = fn($v) => $v === null || $v === '' ? '—' : $nf($v) . '%';
      $val = fn($key, $default = null) => data_get($c, $key, $default);

      $rend = (float) $val('rendimiento', 0);
      $rendClass = $rend >= 99.5 ? 'ok' : ($rend >= 98.0 ? 'mid' : 'warn');
      $hasConc = $c && collect((array)$c)->filter(fn($v) => $v !== null && $v !== '')->isNotEmpty();
    @endphp

    @if ($hasConc)
      <h2 class="section-title">Resumen de Conciliación</h2>

      <div class="section-keep" style="margin-bottom:6px;">
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
    {{-- ===== Fin Resumen de Conciliación ===== --}}

    {{-- ===== Operaciones Ejecutadas ===== --}}
    <h2 class="section-title op-h2">Operaciones Ejecutadas</h2>
    @php
      $fmtTime = function ($ts) {
        try { return $ts ? \Carbon\Carbon::parse($ts)->format('H:i') : '—'; }
        catch (\Throwable $e) { return '—'; }
      };

      $renderValor = function ($valor) {
        if ($valor === null || $valor === '') return '<span class="data-label">—</span>';
        if (is_bool($valor))   return '<span class="data-label">'.($valor?'Sí':'No').'</span>';
        if (is_numeric($valor))return '<span class="data-label">'.e($valor).'</span>';

        if (is_string($valor)) {
          if (str_starts_with($valor, 'data:image')) {
            return '<img src="'.e($valor).'" alt="Evidencia" class="evidence-img">';
          }
          if (filter_var($valor, FILTER_VALIDATE_URL)) {
            $lower = strtolower($valor);
            if (preg_match('/\.(png|jpe?g|webp|gif)$/', $lower)) {
              return '<img src="'.e($valor).'" alt="Evidencia" class="evidence-img">';
            }
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
            foreach ($valor as $v) {
              $html .= '• '.e(is_scalar($v)?$v:json_encode($v,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)).'<br>';
            }
            return $html.'</span>';
          }
          return '<code class="data-label">'.e(json_encode($valor,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)).'</code>';
        }

        return '<span class="data-label">'.e((string)$valor).'</span>';
      };

      $normalize = function ($v) {
        $s = is_string($v) ? strip_tags($v) : '';
        $s = trim(mb_strtolower($s));
        $s = preg_replace('/\s+/u',' ',$s);
        $t = @iconv('UTF-8','ASCII//TRANSLIT',$s);
        return $t !== false ? $t : $s;
      };

      $stageOrderById = collect($stages ?? [])->values()->mapWithKeys(fn($s,$i)=>[$s->id=>$i]);
      $stageOrderByLabel = collect($stages ?? [])->values()->mapWithKeys(function($s,$i) use($normalize){
        $label = $s->description ?? 'Etapa '.$s->id; return [$normalize($label)=>$i];
      });

      $acts = collect($actividadesEjecutadas ?? [])->unique('id')->values();

      $grouped = $acts
        ->map(function($a) use($normalize){
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
            if (is_array($forms)) {
              foreach ($forms as $f) {
                if (is_array($f) && (!empty($f['descripcion_activitie']) || !empty($f['valor']))) { $allForms[] = $f; }
              }
            }
            $created = $raw['created_at'] ?? null;
            $ts = null; try { $ts = $created ? \Carbon\Carbon::parse($created)->timestamp : null; } catch (\Throwable $e) {}
            if ($minCreated === null || ($ts !== null && $ts < $minCreated)) { $minCreated = $ts; }
            $idVal = isset($raw['id']) ? (int)$raw['id'] : PHP_INT_MAX; if ($idVal < $minId) { $minId = $idVal; }
          }
          $first['forms'] = $allForms; $first['_min_created'] = $minCreated ?? 0; $first['_min_id'] = $minId;
          if (empty($first['description_fase'])) { $first['description_fase'] = '—'; }
          return $first;
        });

      $actsSorted = $grouped
        ->sortBy(function($a) use($stageOrderById,$stageOrderByLabel,$normalize){
          $sid = $a['fases_fk'] ?? ($a['stage_id'] ?? ($a['id_stage'] ?? ($a['stage'] ?? null)));
          $rank = PHP_INT_MAX;
          if ($sid !== null && $sid !== '' && isset($stageOrderById[$sid])) { $rank = $stageOrderById[$sid]; }
          else {
            $key = $normalize($a['description_fase'] ?? ''); if ($key !== '' && isset($stageOrderByLabel[$key])) { $rank = $stageOrderByLabel[$key]; }
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
        $formsChunks = array_chunk($forms, 12); /* baja a 10/8 si hay muchas imágenes */
        $firstChunk = $formsChunks ? array_shift($formsChunks) : [];
      @endphp

      @if (!empty($firstChunk))
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
      $controlTables = [];
      foreach ($timers as $timer) {
        foreach ($timer->timerControls as $control) {
          $rows = is_array($control->data) ? array_values($control->data) : [];
          if (!count($rows)) continue;

          $chunks = array_chunk($rows, 12); /* ajusta 8/10/12 según altura/imágenes */
          $userNm = is_object($control->user ?? null) ? ($control->user->name ?? '—') : ($control->user ?? '—');
          $fecha = \Carbon\Carbon::parse($control->created_at)->format('Y-m-d H:i');

          foreach ($chunks as $chunk) {
            $controlTables[] = ['rows' => $chunk, 'user' => $userNm, 'fecha' => $fecha];
          }
        }
      }
    @endphp

    @if (count($controlTables))
      <div class="tabla-container keep-with-title">
        @foreach ($controlTables as $tbl)
          <div class="tabla-item">
            <table class="table table-striped">
              <thead>
                <tr>
                  <th style="width:26%">Descripción</th>
                  <th style="width:36%">Resultado</th>
                  <th style="width:20%">Usuario</th>
                  <th style="width:18%">Fecha y Hora</th>
                </tr>
              </thead>
              <tbody>
                @foreach ($tbl['rows'] as $item)
                  @php
                    $desc  = $item['descripcion'] ?? ($item['description'] ?? '—');
                    $valor = $item['valor'] ?? null;

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
                        <div class="data-label">Min: {{ $valor['min'] }} | Máx: {{ $valor['max'] }} | Medido: <strong>{{ $valor['valor'] }}</strong></div>
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
  $y = $pdf->get_height() - 30;         // ~30pt desde el borde inferior
  $gray = [107/255,114/255,128/255];    // #6b7280

  // Texto
  $left  = "Documento generado automáticamente – Pharex S.A. | Confidencial";
  $right = "Página {PAGE_NUM} de {PAGE_COUNT}";
  $full  = $left . "  |  " . $right;

  // Márgenes (pt)
  $LEFT_MARGIN   = 100;
  $RIGHT_MARGIN  = 0;

  // Centrado dentro del cuadro [LEFT_MARGIN, RIGHT_MARGIN ]
  $usable_width = $pdf->get_width() - $LEFT_MARGIN - ($RIGHT_MARGIN );
  $w = $fontMetrics->get_text_width($full, $font, $size);
  $x = $LEFT_MARGIN + max(0, ($usable_width - $w) / 2);

  $pdf->page_text($x, $y, $full, $font, $size, $gray);
}
</script>

</body>
</html>
