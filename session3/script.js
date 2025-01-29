const table = document.querySelector('.tbody');
const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0MTU1IiwiaWF0IjoxNzM4MTY2NDQ5LCJleHAiOjE3MzgxNjgyNDl9.vmNY4PO5KApLDAsI206D3woKzy3cPVAjKEe3O9hjHfM'; // Замените 'your_jwt_token_here' на ваш реальный JWT токен

document.addEventListener('DOMContentLoaded', () => {
    getDocuments();
});

async function getDocuments() {
    try {
        const response = await fetch("http://localhost:3000/api/v1/Documents", {
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        displayDocuments(result);
    } catch (error) {
        console.error('Error fetching documents:', error);
    }
}

async function fetchComments(documentId) {
    try {
        const response = await fetch(`http://localhost:3000/api/v1/Document/${documentId}/Comments`, {
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const comments = await response.json();
        if (!Array.isArray(comments)) {
            throw new Error('Expected an array of comments');
        }
        return comments;
    } catch (error) {
        console.error('Error fetching comments:', error);
        return [];
    }
}

function analyzeComments(comments) {
    const positiveWords = ["отлично", "прекрасно", "замечательно", "впечатляюще", "радостно", "благодарен", "удовлетворен", "восторженно", "вдохновлён", "превосходно", "великолепно", "идеально", "потрясающе", "классно", "круто", "супер", "рад", "довольный", "восхищённый", "счастливый"];
    const negativeWords = ["разочарован", "плохо", "ужасно", "отвратительно", "недовольный", "обидно", "скучно", "неудобно", "сложно", "проблематично", "непонятно", "ошибочно", "медленно", "неэффективно", "безрезультатно", "несовершенный", "неудачный", "неработающий", "невозможно"];

    let positiveCount = 0;
    let negativeCount = 0;

    comments.forEach(comment => {
        positiveWords.forEach(word => {
            if (comment.text.includes(word)) positiveCount++;
        });
        negativeWords.forEach(word => {
            if (comment.text.includes(word)) negativeCount++;
        });
    });

    let sentiment = 'Нейтральный';
    if (positiveCount > negativeCount) {
        sentiment = 'Позитивный';
    } else if (negativeCount > positiveCount) {
        sentiment = 'Негативный';
    }

    return { positiveCount, negativeCount, sentiment };
}

async function displayDocuments(documents) {
    for (const doc of documents) {
        const comments = await fetchComments(doc.id);
        const { positiveCount, negativeCount, sentiment } = analyzeComments(comments);

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${doc.id}</td>
            <td>${doc.title}</td>
            <td>${doc.category}</td>
            <td>${positiveCount}</td>
            <td>${negativeCount}</td>
            <td>${sentiment}</td>
        `;
        table.append(row);
    }
}