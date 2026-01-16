import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Компонент для добавления структурированных данных (Schema.org) для SEO
 */
export default function StructuredData() {
  const location = useLocation();

  useEffect(() => {
    // Удаляем предыдущие структурированные данные
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());

    // Основная информация об организации
    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Профиль будущего',
      description: 'Психологический навигатор для подростков, родителей и взрослых. Профориентационные тесты для выбора профессии.',
      url: 'https://profilbudushchego.ru',
      logo: 'https://profilbudushchego.ru/logomain.png',
      sameAs: [
        'https://www.instagram.com/profilbudushchego',
        'https://t.me/profilbudushchego',
        'https://www.youtube.com/@profilbudushchego',
        'https://www.tiktok.com/@profilbudushchego',
      ],
    };

    // Информация о сайте
    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Профиль будущего',
      url: 'https://profilbudushchego.ru',
      description: 'Психологический навигатор для подростков, родителей и взрослых. Пройдите тест и узнайте, какая профессия вам подходит.',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://profilbudushchego.ru/?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    };

    // Добавляем структурированные данные
    const addStructuredData = (schema: object) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
    };

    addStructuredData(organizationSchema);
    addStructuredData(websiteSchema);

    // Добавляем специфичные данные для главной страницы
    if (location.pathname === '/') {
      const serviceSchema = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Профориентационный тест',
        description: 'Психологический тест для определения подходящей профессии. Доступны бесплатные и платные варианты для разных возрастных групп.',
        provider: {
          '@type': 'Organization',
          name: 'Профиль будущего',
        },
        areaServed: {
          '@type': 'Country',
          name: 'RU',
        },
        serviceType: 'Профориентация',
      };
      addStructuredData(serviceSchema);
    }

    // Cleanup при размонтировании
    return () => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      scripts.forEach(script => script.remove());
    };
  }, [location.pathname]);

  return null;
}

