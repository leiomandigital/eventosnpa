import React, { useState, useEffect } from 'react';
import { Card, Title, Text, Select, SelectItem, Metric, Grid, Col, BarChart, Badge } from '@tremor/react';
import { BarChart3, Calendar, Users, Apple, CheckCircle2, Clock, FileDown } from 'lucide-react';
import { processChoiceData, processTextData, calculateMetrics, formatDate, applyFilters } from '../../utils/reportUtils';

const ReportsView = ({ events, eventResponses, loadEventResponses, eventResponsesLoading }) => {
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [localFilters, setLocalFilters] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  const openDetailModal = (question, value, data) => {
    setModalConfig({ question, value, data });
    setModalOpen(true);
  };

  const exportToPDF = async (config) => {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const maxWidth = pageWidth - (margin * 2);

    doc.setFontSize(18);
    const titleLines = doc.splitTextToSize(`Relatório: ${config.question.text}`, maxWidth);
    doc.text(titleLines, margin, 22);
    
    // Calculate next Y based on title height
    const titleHeight = titleLines.length * 7;
    let currentY = 22 + titleHeight;

    doc.setFontSize(12);
    doc.text(`Evento: ${selectedEvent.title}`, margin, currentY);
    currentY += 8;
    doc.text(`Segmento: ${config.value || 'Geral'}`, margin, currentY);
    currentY += 8;
    
    let headers = [];
    let tableData = [];

    if (config.mode === 'full') {
      headers = ['Participante', ...config.headers];
      tableData = config.data.map(item => [
        item.name,
        ...config.extraIds.map(id => item.extras[id] || '-')
      ]);
    } else if (config.mode === 'simple_list') {
      headers = ['Participante'];
      tableData = config.data.map(item => [item.name]);
      if (config.summaryNote) {
        doc.setFontSize(10);
        doc.text(`Observações: ${config.summaryNote}`, 14, 45);
      }
    } else if (config.mode === 'grouped') {
      headers = ['Opção', 'Participantes'];
      tableData = Object.entries(config.groupedData).map(([opt, names]) => [
        opt,
        names.join(', ')
      ]);
    }

    autoTable(doc, {
      startY: config.summaryNote ? currentY + 12 : currentY + 7,
      head: [headers],
      body: tableData,
      styles: { fontSize: 8 },
      columnStyles: config.mode === 'grouped' ? { 1: { cellWidth: 140 } } : {}
    });

    doc.save(`Relatorio_${config.question.text.replace(/\s+/g, '_')}.pdf`);
  };

  const DetailModal = ({ config, onClose }) => {
    if (!config) return null;

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-gray-200">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-sky-600">
            <div>
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">{config.question.text}</h3>
              <p className="text-sky-100 text-xs font-medium mt-1">
                Visualizando detalhes para: <span className="font-extrabold underline decoration-sky-300">{config.value || 'Geral'}</span>
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-grow bg-gray-50/30">
            <div className="flex justify-between items-center mb-6">
              <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-3">
                <div className="bg-sky-50 p-2 rounded-lg">
                   <Users className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase block">Total Impactado</span>
                  <span className="text-lg font-bold text-sky-700">{config.data.length} Pessoas</span>
                </div>
              </div>
              
              <button
                onClick={() => exportToPDF(config)}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all shadow-md active:scale-95"
              >
                <FileDown className="w-4 h-4" />
                <span>Exportar PDF</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6">
              {config.mode === 'full' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead className="sticky top-0 z-20">
                      <tr className="border-b border-gray-100">
                        <th className="sticky top-0 z-20 py-3 px-4 text-[10px] font-bold uppercase text-gray-400 bg-gray-50/95 backdrop-blur-sm">Participante</th>
                        {config.headers.map((h, i) => (
                          <th key={i} className="sticky top-0 z-20 py-3 px-4 text-[10px] font-bold uppercase text-gray-400 bg-gray-50/95 backdrop-blur-sm">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {config.data.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold text-gray-700 uppercase text-[10px] block">{item.name}</span>
                          </td>
                          {config.extraIds.map(id => (
                            <td key={id} className="py-3 px-4">
                              <span className="text-[10px] text-gray-500 font-medium italic">
                                {item.extras[id] || '-'}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {config.mode === 'simple_list' && (
                <div className="space-y-4">
                   {config.summaryNote && (
                     <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4 rounded-r-lg">
                       <div className="flex items-center space-x-2">
                         <Apple className="w-4 h-4 text-amber-600" />
                         <span className="text-[11px] font-bold text-amber-700 uppercase">Observações de Restrição Alimentar:</span>
                       </div>
                       <p className="text-[10px] text-amber-600 mt-1 font-medium italic">{config.summaryNote}</p>
                     </div>
                   )}
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                     {config.data.map((item, idx) => (
                       <div key={idx} className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 flex items-center space-x-2">
                         <div className="w-1.5 h-1.5 bg-sky-400 rounded-full"></div>
                         <span className="text-[10px] font-bold text-gray-600 uppercase truncate">{item.name}</span>
                       </div>
                     ))}
                   </div>
                </div>
              )}

              {config.mode === 'grouped' && (
                <div className="space-y-6">
                  {Object.entries(config.groupedData).map(([option, names], idx) => (
                    <div key={idx} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge color="sky" size="sm" className="font-extrabold text-[9px] uppercase px-2 rounded-md">{option}</Badge>
                        <span className="text-[10px] font-bold text-gray-400">({names.length} pessoas)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {names.map((n, i) => (
                          <span key={i} className="text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 font-medium whitespace-nowrap">
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 border border-transparent rounded-lg text-[10px] font-bold text-gray-600 uppercase transition-all"
            >
              Fechar Visualização
            </button>
          </div>
        </div>
      </div>
    );
  };

  const availableEvents = events
    .filter(event => !event.isTemplate && event.responsesCount > 0)
    .sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));

  useEffect(() => {
    if (selectedEventId) {
      const event = events.find(e => e.id === parseInt(selectedEventId));
      setSelectedEvent(event);
      loadEventResponses(parseInt(selectedEventId));
      setLocalFilters({}); 
    } else {
      setSelectedEvent(null);
    }
  }, [selectedEventId, events, loadEventResponses]);

  const rawResponses = eventResponses || [];
  const metrics = selectedEvent ? calculateMetrics(rawResponses) : null;

  const handleLocalFilterChange = (questionId, value) => {
    setLocalFilters(prev => {
      const newFilters = { ...prev };
      if (newFilters[questionId] === value) {
        delete newFilters[questionId];
      } else {
        newFilters[questionId] = value;
      }
      return newFilters;
    });
  };

  const removeLocalFilter = (questionId) => {
    setLocalFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[questionId];
      return newFilters;
    });
  };

  const extractInsights = (currentSet, activeValue = null) => {
    const namesSet = new Set();
    const restrictionsCount = {};
    let totalPeopleCount = 0;

    currentSet.forEach(res => {
      const nameAnswer = res.answers.find(a => {
        const q = selectedEvent.questions.find(sq => sq.id === a.questionId);
        return q?.type === 'text_list';
      });

      if (nameAnswer?.value) {
        const list = String(nameAnswer.value).split(',').map(n => n.trim()).filter(Boolean);
        list.forEach(n => namesSet.add(n));
        totalPeopleCount += list.length;
      } else {
        totalPeopleCount += 1;
      }

      res.answers.forEach(ans => {
        const q = selectedEvent.questions.find(sq => sq.id === ans.questionId);
        if (!q) return;
        const isLogistical = q.text.toLowerCase().includes('restri') || 
                            q.text.toLowerCase().includes('alerg') || 
                            q.text.toLowerCase().includes('obs') ||
                            q.text.toLowerCase().includes('aliment');

        if (isLogistical && ans.value && !['-', 'não', 'n/a', 'nenhuma', 'não possui', 'não tenho'].includes(ans.value.toLowerCase().trim())) {
          const parts = String(ans.value).split(/[,;]/).map(p => p.trim()).filter(Boolean);
          parts.forEach(p => {
             restrictionsCount[p] = (restrictionsCount[p] || 0) + 1;
          });
        }
      });
    });

    let restrictionsList = Object.keys(restrictionsCount).map(key => ({
      name: key,
      count: restrictionsCount[key]
    }));

    if (activeValue) {
      const activeRest = activeValue.trim();
      const matches = restrictionsList.filter(r => r.name === activeRest);
      if (matches.length > 0) {
        restrictionsList = matches;
      }
    }

    return {
      names: Array.from(namesSet),
      restrictions: restrictionsList,
      totalPeople: totalPeopleCount,
      responseCount: currentSet.length
    };
  };

  const renderQuestionWidget = (question) => {
    if (!rawResponses || rawResponses.length === 0) return null;

    // Inclusive Logistical Discovery (finds ALL questions related to logistics)
    const logisticalQuestions = selectedEvent.questions.filter(q => {
      const text = q.text.toLowerCase();
      return text.includes('almoço') || 
             text.includes('janta') || 
             text.includes('jantar') || 
             q.type === 'time' || 
             /horário|chegada|restri|alerg|aliment|dieta/i.test(text);
    });

    const getCleanValue = (val) => {
      const lower = String(val || '').toLowerCase().trim();
      if (!lower || ['-', 'não', 'n/a', 'nenhuma', 'não possui', 'não tenho', 'sem restrições'].includes(lower)) return '-';
      return val;
    };

    switch (question.type) {
      case 'time':
      case 'single_choice':
      case 'multiple_choice': {
        const groups = {};
        rawResponses.forEach(res => {
          const ans = res.answers.find(a => a.questionId === question.id);
          if (!ans?.value) return;
          
          const values = question.type === 'multiple_choice' 
            ? String(ans.value).split(',').map(v => v.trim()).filter(Boolean)
            : [ans.value];

          const nameAnswer = res.answers.find(a => {
            const q = selectedEvent.questions.find(sq => sq.id === a.questionId);
            return q?.type === 'text_list';
          });
          
          const names = nameAnswer?.value 
            ? String(nameAnswer.value).split(',').map(n => n.trim()).filter(Boolean) 
            : [res.user?.name || 'Incompleto'];

          values.forEach(val => {
            if (!groups[val]) groups[val] = { count: 0, names: [] };
            groups[val].count += names.length;
            names.forEach(name => groups[val].names.push(name));
          });
        });

        const sortedKeys = Object.keys(groups).sort((a, b) => 
          a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
        );

        const handleChoiceClick = (selectedOption) => {
          const isFood = /almoç|jant/i.test(question.text);
          
          if (question.type === 'single_choice') {
            let summaryNote = null;
            
            if (isFood) {
              const restrictionQs = selectedEvent.questions.filter(q => /restri|alerg|aliment|dieta/i.test(q.text.toLowerCase()));
              const restrictionsRaw = [];
              
              rawResponses.forEach(res => {
                const qAns = res.answers.find(a => a.questionId === question.id);
                if (qAns?.value === selectedOption) {
                  restrictionQs.forEach(rq => {
                    const rAns = res.answers.find(a => a.questionId === rq.id);
                    const val = rAns?.value;
                    if (val) {
                      // Split by comma to handle multiple restrictions in one answer
                      const items = String(val).split(',').map(i => i.trim()).filter(Boolean);
                      items.forEach(item => {
                        if (getCleanValue(item) !== '-') {
                          restrictionsRaw.push(item);
                        }
                      });
                    }
                  });
                }
              });
              
              // De-duplicate case-insensitively but preserve first encountered casing
              const normalizedMap = new Map();
              restrictionsRaw.forEach(r => {
                const lower = r.toLowerCase();
                if (!normalizedMap.has(lower)) {
                  normalizedMap.set(lower, r);
                }
              });
              
              const uniqueRestrictions = Array.from(normalizedMap.values())
                .sort((a, b) => a.localeCompare(b));
                
              summaryNote = uniqueRestrictions.length > 0 ? uniqueRestrictions.join(', ') : 'Nenhuma restrição informada.';
            }

            setModalConfig({
              mode: 'simple_list',
              question,
              value: selectedOption,
              data: groups[selectedOption].names.map(name => ({ name })),
              summaryNote
            });
          } else {
            // Grouped view for Time and Multiple Choice
            const groupedData = {};
            sortedKeys.forEach(k => { groupedData[k] = groups[k].names; });

            setModalConfig({
              mode: 'grouped',
              question,
              value: 'Resumo Agrupado',
              groupedData,
              data: Object.values(groups).flatMap(g => g.names.map(name => ({ name })))
            });
          }
          setModalOpen(true);
        };

        return (
          <Card key={question.id} className="h-full border border-gray-200 shadow-sm rounded-xl p-0 overflow-hidden hover:shadow-md transition-all group bg-white flex flex-col">
             <div className="p-4 flex items-center justify-between border-b border-gray-50 group-hover:bg-sky-50/30 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-sky-50 rounded-lg text-sky-600">
                    {question.type === 'time' ? <Clock className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
                  </div>
                <Title className="text-sm font-bold text-gray-700">{question.text}</Title>
              </div>
            </div>
             
             <div className="p-4 flex flex-wrap gap-2">
                {sortedKeys.map(key => (
                  <button
                    key={key}
                    onClick={() => handleChoiceClick(key)}
                    className="flex items-center space-x-2 bg-sky-50 hover:bg-sky-600 hover:text-white px-3 py-1.5 rounded-lg border border-sky-100 transition-all group/btn shadow-sm active:scale-95"
                  >
                    {question.type === 'time' ? (
                      <Clock className="w-3.5 h-3.5 text-sky-600 group-hover/btn:text-white" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 group-hover/btn:text-white" />
                    )}
                    <span className="text-sm font-bold uppercase tracking-tight text-sky-800 group-hover/btn:text-white">{key}</span>
                    <span className="bg-white group-hover/btn:bg-sky-500 group-hover/btn:text-white px-2 py-0.5 rounded text-sm font-bold text-sky-700 border border-sky-100 group-hover/btn:border-sky-400 min-w-[24px] text-center">
                      {groups[key].count}
                    </span>
                  </button>
                ))}
                {sortedKeys.length === 0 && (
                  <span className="text-xs text-gray-400 italic">Sem dados registrados.</span>
                )}
             </div>
          </Card>
        );
      }

      case 'text_list': {
        const insights = extractInsights(rawResponses);
        
        const handleNamesClick = () => {
          const allQuestions = selectedEvent.questions.filter(q => q.id !== question.id);
          const detailData = rawResponses.flatMap(res => {
            const nameAnswer = res.answers.find(a => a.questionId === question.id);
            if (!nameAnswer?.value) return [];
            
            const names = String(nameAnswer.value).split(',').map(n => n.trim()).filter(Boolean);
            
            const extras = {};
            allQuestions.forEach(q => {
              const ans = res.answers.find(a => a.questionId === q.id);
              extras[q.id] = getCleanValue(ans?.value);
            });

            return names.map(name => ({ name, extras }));
          });

          setModalConfig({
            mode: 'full',
            question,
            value: 'Lista Geral de Logística',
            data: detailData,
            headers: allQuestions.map(q => q.text),
            extraIds: allQuestions.map(q => q.id)
          });
          setModalOpen(true);
        };

        return (
          <Card key={question.id} className="h-full border border-gray-200 shadow-sm rounded-xl p-0 overflow-hidden hover:shadow-md transition-all group bg-white flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-gray-50 group-hover:bg-sky-50/10 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-sky-50 rounded-lg text-sky-600">
                  <Users className="w-4 h-4" />
                </div>
                <Title className="text-sm font-bold text-gray-700">{question.text}</Title>
              </div>
            </div>

            <div className="p-4">
              <button
                onClick={handleNamesClick}
                className="flex items-center space-x-3 bg-sky-50 hover:bg-sky-600 hover:text-white px-4 py-2 rounded-lg border border-sky-100 transition-all group/btn shadow-sm active:scale-95"
              >
                <Users className="w-5 h-5 text-sky-600 group-hover/btn:text-white" />
                <span className="text-sm font-bold uppercase tracking-tight text-sky-800 group-hover/btn:text-white">Total</span>
                <span className="bg-white group-hover/btn:bg-sky-500 group-hover/btn:text-white px-2 py-0.5 rounded text-sm font-bold text-sky-700 border border-sky-100 group-hover/btn:border-sky-400 min-w-[24px] text-center">
                  {insights.totalPeople}
                </span>
              </button>
            </div>
          </Card>
        );
      }

      case 'short_text':
      case 'long_text': {
        const data = processTextData(question, rawResponses, {});
        if (data.length === 0) return null;
        return (
          <Card key={question.id} className="mt-6 border border-gray-200 shadow-sm rounded-lg p-6 bg-white">
            <div className="flex items-center space-x-2 mb-4">
              {question.type === 'time' && <Clock className="w-4 h-4 text-sky-600" />}
              <Title className="text-lg font-bold text-gray-800 border-l-4 border-sky-600 pl-3">{question.text}</Title>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.map((item, idx) => (
                <div key={idx} className="bg-sky-50 rounded-lg p-3 border border-sky-100 flex flex-col justify-between shadow-xs">
                  <p className="text-xs text-sky-900 leading-relaxed italic font-medium">"{item.value}"</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-sky-100/50 text-[9px]">
                    <span className="font-bold text-sky-600 uppercase">{item.user?.name || 'Incompleto'}</span>
                    <span className="text-sky-300 font-bold">{formatDate(item.submittedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      }

      default: return null;
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50/10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-sky-600">Relatórios de Evento</h2>
          <p className="text-sm text-gray-500">Visualize o desempenho e logística dos seus eventos.</p>
        </div>
        
        {Object.keys(localFilters).length > 0 && (
          <button
            onClick={() => setLocalFilters({})}
            className="flex items-center space-x-2 text-white bg-sky-600 hover:bg-sky-700 px-4 py-2 rounded-lg text-xs font-bold uppercase shadow-sm transition-all"
          >
            <span>Remover Filtros</span>
            <span className="bg-white/20 px-2 py-0.5 rounded text-[9px]">
              {Object.keys(localFilters).length}
            </span>
          </button>
        )}
      </div>

      <Card className="mb-8 border border-gray-200 shadow-sm rounded-lg bg-white p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="md:col-span-3">
              <Text className="text-[10px] font-bold uppercase tracking-widest text-sky-600 mb-2">Evento Selecionado</Text>
              <Select value={selectedEventId} onValueChange={setSelectedEventId} placeholder="Selecione um evento...">
                {availableEvents.map(event => (
                  <SelectItem key={event.id} value={String(event.id)}>
                    {event.title} — {new Date(event.eventDate).toLocaleDateString('pt-BR')}
                  </SelectItem>
                ))}
              </Select>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 text-center">
                <Text className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total</Text>
                <Metric className="text-2xl text-sky-600 font-bold">{availableEvents.length}</Metric>
            </div>
          </div>
        </Card>

        {eventResponsesLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-gray-100 border-t-sky-600 rounded-full animate-spin"></div>
            <Text className="mt-4 text-gray-400 font-bold text-[10px] uppercase tracking-widest">Sincronizando dados...</Text>
          </div>
        )}

        {selectedEvent && !eventResponsesLoading && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
            <Grid numItemsMd={3} className="gap-4 mb-8">
              <Card className="border border-gray-200 shadow-sm rounded-lg p-4 bg-white border-l-4 border-l-sky-600">
                <Text className="text-gray-400 text-[10px] font-bold uppercase mb-1">Respostas</Text>
                <Metric className="text-3xl text-gray-800 font-bold">{metrics?.totalResponses}</Metric>
              </Card>
              <Card className="border border-gray-200 shadow-sm rounded-lg p-4 bg-white border-l-4 border-l-gray-300">
                <Text className="text-gray-400 text-[10px] font-bold uppercase mb-1">Primeira</Text>
                <div className="flex items-center space-x-2 mt-1">
                  <Calendar className="w-4 h-4 text-sky-600" />
                  <Metric className="text-xl text-gray-800 font-bold">{formatDate(metrics?.firstResponseDate)}</Metric>
                </div>
              </Card>
              <Card className="border border-gray-200 shadow-sm rounded-lg p-4 bg-white border-l-4 border-l-green-500">
                <Text className="text-gray-400 text-[10px] font-bold uppercase mb-1">Última</Text>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                  <Metric className="text-xl text-gray-800 font-bold">{formatDate(metrics?.lastResponseDate)}</Metric>
                </div>
              </Card>
            </Grid>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedEvent.questions.map(question => (
                <div key={question.id}>{renderQuestionWidget(question)}</div>
              ))}
            </div>
          </div>
        )}

        {modalOpen && (
          <DetailModal 
            config={modalConfig} 
            onClose={() => setModalOpen(false)} 
          />
        )}

        {!selectedEvent && !eventResponsesLoading && (
          <div className="mt-20 text-center animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <BarChart3 className="w-6 h-6 text-gray-200" />
            </div>
            <Title className="text-xl font-bold text-gray-800">Pronto para Análise</Title>
            <Text className="text-gray-400 mt-2 text-sm">Escolha um evento acima para carregar os dados.</Text>
          </div>
        )}
    </div>
  );
};

export default ReportsView;
