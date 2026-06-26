import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Metricas, NcStats } from './queries'
import { pct, dataBR } from './format'

interface PdfPayload {
  periodo: string
  setor?: string
  responsavel?: string
  metricas: Metricas
  ncStats: NcStats
  evolucao: { data: string; score: number }[]
}

const EMERALD = [16, 185, 129] as [number, number, number]
const SLATE_DARK = [15, 23, 42] as [number, number, number]
const SLATE_MID = [100, 116, 139] as [number, number, number]
const SLATE_LIGHT = [241, 245, 249] as [number, number, number]

function resumoExecutivo(p: PdfPayload): string {
  const { metricas: m, ncStats: nc, periodo } = p
  const score = Math.round(m.score)
  const criticas = nc.criticas
  const vencidas = nc.vencidas
  const piorSetor = nc.porSetor[0]?.nome ?? null

  let texto = `No período de ${periodo} foram realizados ${m.total} checklist${m.total !== 1 ? 's' : ''}, com taxa de conclusão de ${Math.round(m.conclusao)}% e conformidade geral de ${score}%. `

  if (nc.total === 0) {
    texto += 'Nenhuma não conformidade foi identificada no período — excelente desempenho operacional.'
  } else {
    texto += `Foram identificadas ${nc.total} não conformidade${nc.total !== 1 ? 's' : ''}`
    if (criticas > 0) texto += `, sendo ${criticas} de alta criticidade`
    if (vencidas > 0) texto += ` e ${vencidas} com prazo vencido`
    texto += '. '
    if (piorSetor) texto += `O setor "${piorSetor}" concentrou a maior incidência de falhas, indicando necessidade de ação corretiva prioritária.`
  }

  if (score < 70) texto += ' A conformidade geral está abaixo do padrão recomendado (70%). Recomenda-se revisão imediata das rotinas operacionais.'
  else if (score >= 90) texto += ' O desempenho geral está acima do padrão de excelência (90%).'

  return texto
}

export function gerarRelatorioPdf(payload: PdfPayload) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const PAGE_W = 210
  const MARGIN = 14
  const CONTENT_W = PAGE_W - MARGIN * 2
  const now = new Date().toLocaleString('pt-BR')

  // ── Capa ──────────────────────────────────────────────────
  doc.setFillColor(...SLATE_DARK)
  doc.rect(0, 0, PAGE_W, 65, 'F')

  doc.setFillColor(...EMERALD)
  doc.rect(0, 65, PAGE_W, 3, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.text('Manga Check', MARGIN, 28)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(148, 163, 184)
  doc.text('Relatório Gerencial de Checklists Digitais', MARGIN, 37)

  doc.setFontSize(9.5)
  doc.text(`Período: ${payload.periodo}`, MARGIN, 48)
  if (payload.setor) doc.text(`Setor: ${payload.setor}`, MARGIN, 54)
  if (payload.responsavel) doc.text(`Responsável: ${payload.responsavel}`, MARGIN, 54 + (payload.setor ? 6 : 0))

  // ── Resumo Executivo ───────────────────────────────────────
  let y = 80
  doc.setTextColor(...SLATE_DARK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Resumo Executivo', MARGIN, y)

  doc.setFillColor(...EMERALD)
  doc.rect(MARGIN, y + 2, 30, 0.8, 'F')
  y += 9

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...SLATE_MID)
  const linhas = doc.splitTextToSize(resumoExecutivo(payload), CONTENT_W)
  doc.text(linhas, MARGIN, y)
  y += linhas.length * 5 + 8

  // ── KPIs Checklists ────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...SLATE_DARK)
  doc.text('Indicadores de Checklists', MARGIN, y)
  doc.setFillColor(...EMERALD)
  doc.rect(MARGIN, y + 2, 38, 0.8, 'F')
  y += 6

  const { metricas: m } = payload
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [['Indicador', 'Valor', 'Referência']],
    body: [
      ['Total de checklists', m.total.toString(), '—'],
      ['Finalizados', m.finalizados.toString(), `${Math.round(m.conclusao)}% do total`],
      ['Em andamento', m.emAndamento.toString(), `${Math.round(m.esforco)}% de esforço`],
      ['Atrasados', m.atrasado.toString(), '—'],
      ['Score geral', pct(m.score), 'Pontualidade 40% + Qualidade 40% + Conclusão 20%'],
      ['Pontualidade', pct(m.pontualidade), 'Finalizados dentro do prazo'],
      ['Qualidade', pct(m.qualidade), 'Itens conformes / total respondidos'],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: SLATE_DARK, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: SLATE_LIGHT },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: 25, halign: 'center' }, 2: { cellWidth: 90 } },
  })

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  // ── KPIs Não Conformidades ─────────────────────────────────
  const nc = payload.ncStats
  if (nc.total > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...SLATE_DARK)
    doc.text('Não Conformidades', MARGIN, y)
    doc.setFillColor(...EMERALD)
    doc.rect(MARGIN, y + 2, 34, 0.8, 'F')
    y += 6

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Status', 'Quantidade']],
      body: [
        ['Total de NCs', nc.total.toString()],
        ['Abertas', nc.abertas.toString()],
        ['Em andamento', nc.emAndamento.toString()],
        ['Vencidas', nc.vencidas.toString()],
        ['Concluídas', nc.concluidas.toString()],
        ['De alta criticidade (alta + crítica)', nc.criticas.toString()],
      ],
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [220, 38, 38] as [number, number, number], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: SLATE_LIGHT },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 110 }, 1: { cellWidth: 25, halign: 'center' } },
    })

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

    // NC por setor
    if (nc.porSetor.length > 0) {
      if (y > 240) { doc.addPage(); y = 20 }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...SLATE_DARK)
      doc.text('NCs por Setor', MARGIN, y)
      y += 5
      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [['Setor', 'Quantidade']],
        body: nc.porSetor.map(s => [s.nome, s.count.toString()]),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: SLATE_DARK, textColor: 255, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: SLATE_LIGHT },
        columnStyles: { 0: { cellWidth: 110 }, 1: { cellWidth: 25, halign: 'center' } },
      })
      y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
    }

    // Top 5 itens
    if (nc.topItens.length > 0) {
      if (y > 240) { doc.addPage(); y = 20 }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...SLATE_DARK)
      doc.text('Top 5 Itens Mais Não Conformes', MARGIN, y)
      y += 5
      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [['Item', 'Ocorrências']],
        body: nc.topItens.map((it, i) => [`${i + 1}. ${it.descricao}`, it.count.toString()]),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: SLATE_DARK, textColor: 255, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: SLATE_LIGHT },
        columnStyles: { 1: { cellWidth: 25, halign: 'center' } },
      })
      y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
    }
  }

  // ── Evolução ───────────────────────────────────────────────
  if (payload.evolucao.length > 0) {
    if (y > 220) { doc.addPage(); y = 20 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...SLATE_DARK)
    doc.text('Evolução do Score por Dia', MARGIN, y)
    y += 5
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Data', 'Score']],
      body: payload.evolucao.map(e => [dataBR(e.data), `${e.score}%`]),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: SLATE_DARK, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: SLATE_LIGHT },
      columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 25, halign: 'center' } },
    })
  }

  // ── Rodapé em todas as páginas ─────────────────────────────
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(MARGIN, 287, PAGE_W - MARGIN, 287)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...SLATE_MID)
    doc.text(`Manga Check · Relatório Gerencial · Emitido em ${now}`, MARGIN, 292)
    doc.text(`Página ${i} de ${pages}`, PAGE_W - MARGIN, 292, { align: 'right' })
  }

  doc.save(`manga-check-relatorio-${new Date().toISOString().slice(0, 10)}.pdf`)
}
