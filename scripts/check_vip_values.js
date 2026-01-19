const fs = require('fs');

const files = ['src/tests/VIP/12-17.json', 'src/tests/VIP/18-20.json', 'src/tests/VIP/21plus.json'];

files.forEach(file => {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const issues = [];
  
  data.questions.forEach(q => {
    q.options.forEach((opt, idx) => {
      if (!opt.value) {
        issues.push(`Q${q.id} option ${idx + 1}`);
      }
    });
  });
  
  if (issues.length > 0) {
    console.log(`${file}: ❌ Проблемы:`, issues.join(', '));
  } else {
    console.log(`${file}: ✅ Все варианты имеют value`);
    // Показываем пример
    const sample = data.questions[0];
    console.log(`  Пример: Q${sample.id} - value: [${sample.options.map(o => o.value).join(', ')}]`);
  }
});

