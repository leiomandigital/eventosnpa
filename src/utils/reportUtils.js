/**
 * Funções utilitárias para processamento de dados de relatórios
 */

/**
 * Processa dados de perguntas do tipo "Escolha Única" ou "Múltipla Escolha"
 * Retorna array de objetos {name: string, value: number} para gráficos
 */
export function processChoiceData(question, responses, filters = {}, allQuestions = []) {
    // Filtra respostas baseado nos filtros ativos, exceto para a própria pergunta
    const filteredResponses = applyFilters(responses, filters, question.id);

    const counts = {};
    let totalCounted = 0;

    filteredResponses.forEach(response => {
        const answer = response.answers.find(a => a.questionId === question.id);
        if (!answer || !answer.value) return;

        // Suporta tanto texto simples quanto valores separados por vírgula (múltipla escolha)
        const values = String(answer.value).split(',').map(v => v.trim()).filter(Boolean);
        values.forEach(value => {
            counts[value] = (counts[value] || 0) + 1;
        });
        totalCounted++;
    });

    // Converte para formato de gráfico e ordena por nome (cronológico para horas/alfabético para opções)
    return Object.entries(counts)
        .map(([name, value]) => ({
            name,
            value,
            percentage: totalCounted > 0 ? ((value / totalCounted) * 100).toFixed(1) : 0
        }))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
}

/**
 * Processa dados de perguntas do tipo "Lista de Texto" (Tags)
 * Retorna objeto com total de itens e frequência de cada tag
 */
export function processTextListData(question, responses, filters = {}) {
    const filteredResponses = applyFilters(responses, filters);

    const answers = filteredResponses
        .map(response => {
            const answer = response.answers.find(a => a.questionId === question.id);
            return answer ? answer.value : null;
        })
        .filter(Boolean);

    // Divide tags e conta frequência
    const tagCounts = {};
    let totalTags = 0;

    answers.forEach(answer => {
        const tags = answer.split(',').map(t => t.trim()).filter(Boolean);
        totalTags += tags.length;

        tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });

    // Ordena por frequência (top tags)
    const topTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

    return {
        totalTags,
        totalResponses: filteredResponses.length,
        topTags,
        allTags: tagCounts
    };
}

/**
 * Processa dados de perguntas de texto livre
 * Retorna array de respostas para listagem
 */
export function processTextData(question, responses, filters = {}) {
    const filteredResponses = applyFilters(responses, filters);

    return filteredResponses
        .map(response => {
            const answer = response.answers.find(a => a.questionId === question.id);
            return {
                value: answer?.value || '',
                submittedAt: response.submittedAt,
                user: response.user
            };
        })
        .filter(item => item.value);
}

/**
 * Aplica filtros às respostas
 * Filters: { questionId: selectedValue }
 * excludeQuestionId: opcional, ignora o filtro desta pergunta
 */
export function applyFilters(responses, filters, excludeQuestionId = null) {
    if (!responses) return [];
    if (Object.keys(filters).length === 0) {
        return responses;
    }

    return responses.filter(response => {
        return Object.entries(filters).every(([questionId, filterValue]) => {
            const qIdInt = parseInt(questionId);

            // Se estamos gerando dados para este gráfico, não filtramos por ele mesmo para manter as barras visíveis
            if (excludeQuestionId !== null && qIdInt === excludeQuestionId) return true;

            const answer = response.answers.find(a => a.questionId === qIdInt);
            if (!answer || !answer.value) return false;

            const answerValues = String(answer.value).split(',').map(v => v.trim());
            return answerValues.includes(filterValue);
        });
    });
}

/**
 * Calcula métricas gerais do evento
 */
export function calculateMetrics(responses) {
    if (!responses || responses.length === 0) {
        return {
            totalResponses: 0,
            lastResponseDate: null,
            firstResponseDate: null
        };
    }

    const sortedByDate = [...responses].sort((a, b) =>
        new Date(b.submittedAt) - new Date(a.submittedAt)
    );

    return {
        totalResponses: responses.length,
        lastResponseDate: sortedByDate[0]?.submittedAt,
        firstResponseDate: sortedByDate[sortedByDate.length - 1]?.submittedAt
    };
}

/**
 * Formata data para exibição
 */
export function formatDate(dateString) {
    if (!dateString) return '-';

    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}
