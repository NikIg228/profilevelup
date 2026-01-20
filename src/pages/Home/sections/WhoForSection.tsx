import WhoForCards from './WhoForCards';

export default function WhoForSection() {
  return (
    <section className="container-balanced mt-12 lg:mt-16">
      <div className="relative mb-4 sm:mb-6">
        {/* Верхняя золотая полоса */}
        <div className="absolute -top-3 sm:-top-4 left-1/2 lg:left-0 -translate-x-1/2 lg:translate-x-0 w-20 sm:w-24 h-0.5 sm:h-1 bg-primary rounded-full opacity-60"></div>
        
        {/* Заголовок между полосами */}
        <div className="relative flex flex-col items-center lg:items-start gap-1.5 sm:gap-2">
          <h2 className="text-xl sm:text-2xl font-semibold relative z-10">Кому подойдёт</h2>
          {/* Нижняя золотая полоса */}
          <div className="w-12 sm:w-16 h-0.5 bg-primary/40"></div>
        </div>
      </div>
      <WhoForCards />
    </section>
  );
}

