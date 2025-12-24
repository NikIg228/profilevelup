import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface TestResult {
  name: string;
  age: string;
  gender: string;
  testType: string;
  direction: string;
  votes: {
    people: number;
    tech: number;
    create: number;
  };
  answers: Record<string, string>;
  date: string;
}

export async function generateTestPDF(result: TestResult) {
  // Создаём временный HTML элемент с результатами
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = '210mm'; // A4 width
  tempDiv.style.padding = '40px';
  tempDiv.style.backgroundColor = '#ffffff';
  tempDiv.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  tempDiv.style.color = '#000000';
  tempDiv.style.fontSize = '14px';
  tempDiv.style.lineHeight = '1.6';

  const maxVotes = Math.max(result.votes.people, result.votes.tech, result.votes.create);
  const totalVotes = result.votes.people + result.votes.tech + result.votes.create;

  let description = '';
  if (result.direction === 'Коммуникации и сервис') {
    description = 'Вы склонны к работе с людьми, помощи другим и созданию комфортной атмосферы. Вам подходят профессии, связанные с общением, консультированием, обучением и сервисом.';
  } else if (result.direction === 'Технологии и аналитика') {
    description = 'Вы предпочитаете структурированный подход, работу с данными и технологиями. Вам комфортно в сферах, требующих аналитического мышления, точности и системного подхода.';
  } else {
    description = 'Вы творческий человек, который любит создавать новое и мыслить нестандартно. Вам подходят профессии, связанные с искусством, дизайном, креативными индустриями и инновациями.';
  }

  const categories = [
    { name: 'Коммуникации и сервис', value: result.votes.people, percentage: totalVotes > 0 ? Math.round((result.votes.people / totalVotes) * 100) : 0, color: '#3b82f6' },
    { name: 'Технологии и аналитика', value: result.votes.tech, percentage: totalVotes > 0 ? Math.round((result.votes.tech / totalVotes) * 100) : 0, color: '#22c55e' },
    { name: 'Креативные индустрии', value: result.votes.create, percentage: totalVotes > 0 ? Math.round((result.votes.create / totalVotes) * 100) : 0, color: '#a855f7' },
  ];

  tempDiv.innerHTML = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #22c55e; font-size: 28px; margin: 0 0 10px 0; font-weight: 600;">Результаты профориентационного теста</h1>
      <div style="height: 2px; background-color: #22c55e; margin: 0 auto; width: 200px;"></div>
    </div>

    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 15px; color: #000;">Информация о тестируемом:</h2>
      <div style="padding-left: 20px;">
        <p style="margin: 8px 0;"><strong>Имя:</strong> ${result.name}</p>
        <p style="margin: 8px 0;"><strong>Возраст:</strong> ${result.age} лет</p>
        <p style="margin: 8px 0;"><strong>Пол:</strong> ${result.gender}</p>
        <p style="margin: 8px 0;"><strong>Тип теста:</strong> ${result.testType}</p>
        <p style="margin: 8px 0;"><strong>Дата прохождения:</strong> ${result.date}</p>
      </div>
    </div>

    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 15px; color: #22c55e;">Ваш результат:</h2>
      <h3 style="font-size: 22px; font-weight: 600; margin: 10px 0; color: #000;">Направление: ${result.direction}</h3>
    </div>

    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 15px; color: #000;">Детализация результатов:</h2>
      ${categories.map(cat => `
        <div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <span style="font-weight: 600; color: ${cat.color};">${cat.name}</span>
            <span style="font-size: 13px;">${cat.value} баллов (${cat.percentage}%)</span>
          </div>
          <div style="width: 100%; height: 8px; background-color: #e5e7eb; border-radius: 4px; overflow: hidden;">
            <div style="width: ${cat.percentage}%; height: 100%; background-color: ${cat.color}; transition: width 0.3s;"></div>
          </div>
        </div>
      `).join('')}
    </div>

    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 15px; color: #000;">Описание направления:</h2>
      <p style="text-align: justify; line-height: 1.8;">${description}</p>
    </div>

    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 15px; color: #000;">Рекомендации:</h2>
      <ol style="padding-left: 25px; line-height: 1.8;">
        <li style="margin-bottom: 8px;">Изучите профессии в выбранном направлении более детально</li>
        <li style="margin-bottom: 8px;">Пройдите практику или стажировку в интересующей сфере</li>
        <li style="margin-bottom: 8px;">Развивайте навыки, необходимые для выбранного направления</li>
        <li style="margin-bottom: 8px;">Общайтесь с профессионалами в этой области</li>
        <li style="margin-bottom: 8px;">Рассмотрите возможность получения дополнительного образования</li>
      </ol>
    </div>

    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #808080; font-size: 11px;">
      <p style="margin: 5px 0;">Этот отчёт сгенерирован автоматически на основе ваших ответов.</p>
      <p style="margin: 5px 0;">Результаты носят рекомендательный характер.</p>
    </div>
  `;

  document.body.appendChild(tempDiv);

  try {
    // Конвертируем HTML в canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Удаляем временный элемент
    document.body.removeChild(tempDiv);

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = 0;

    // Добавляем первую страницу
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Добавляем дополнительные страницы если нужно
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Сохраняем PDF
    const fileName = `Профориентационный_тест_${result.name}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    document.body.removeChild(tempDiv);
    console.error('Ошибка при генерации PDF:', error);
    alert('Произошла ошибка при генерации PDF. Попробуйте ещё раз.');
  }
}

