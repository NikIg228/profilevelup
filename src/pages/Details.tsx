import { motion } from 'framer-motion';
import { 
  Compass, 
  FlaskConical, 
  Lightbulb, 
  Target, 
  Settings, 
  Heart, 
  Users, 
  Brain, 
  Video, 
  Sparkles 
} from 'lucide-react';

export default function DetailsPage() {
  return (
    <section className="container-balanced mt-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto space-y-12"
      >
        {/* Зачем это нужно */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Compass className="w-6 h-6 text-primary flex-shrink-0" />
            <h2 className="text-2xl font-semibold text-heading">Зачем это нужно</h2>
          </div>
          <div className="space-y-3 text-muted leading-relaxed">
            <p>
              Мы часто стараемся "подобрать профессию", не понимая, в какой среде человек раскрывается естественно.
            </p>
            <p>
              Этот тест помогает не искать "идеальную работу", а понять, как ты устроен, что тебе по душе и почему.
            </p>
          </div>
        </div>

        {/* Что лежит в основе */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <FlaskConical className="w-6 h-6 text-primary flex-shrink-0" />
            <h2 className="text-2xl font-semibold text-heading">Что лежит в основе</h2>
          </div>
          <div className="space-y-3 text-muted leading-relaxed">
            <p>
              Основой теста стали две признанные мировые методики — RIASEC и MBTI.
            </p>
            <p>
              Они помогают понять не "кем быть", а в какой среде человек раскрывается естественно,
              и активно применяются в профориентации и карьерном консультировании по всему миру.
            </p>
          </div>
        </div>

        {/* Что вы получите */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-6 h-6 text-primary flex-shrink-0" />
            <h2 className="text-2xl font-semibold text-heading">Что вы получите</h2>
          </div>
          
          <div className="space-y-6">
            {/* Ясность */}
            <div className="card p-6 border border-secondary/40">
              <div className="flex items-start gap-3">
                <Compass className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-heading">Ясность</h3>
                  <p className="text-muted leading-relaxed">
                    Вы увидите, какие решения и форматы деятельности вам даются естественно,
                    а где вы тратите энергию, пытаясь соответствовать чужим ожиданиям.
                  </p>
                </div>
              </div>
            </div>

            {/* Осознание своих сильных сторон */}
            <div className="card p-6 border border-secondary/40">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-heading">Осознание своих сильных сторон</h3>
                  <p className="text-muted leading-relaxed">
                    Результат покажет, в чём ваша природная сила —
                    в анализе, общении, создании, системности или вдохновении других.
                  </p>
                </div>
              </div>
            </div>

            {/* Практическое понимание */}
            <div className="card p-6 border border-secondary/40">
              <div className="flex items-start gap-3">
                <Settings className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-heading">Практическое понимание</h3>
                  <p className="text-muted leading-relaxed">
                    Вы узнаете, в какой среде чувствуете себя комфортно:
                    в стабильной системе, динамичном проекте или в свободном творчестве.
                  </p>
                </div>
              </div>
            </div>

            {/* Лучшее понимание себя и других */}
            <div className="card p-6 border border-secondary/40">
              <div className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-heading">Лучшее понимание себя и других</h3>
                  <p className="text-muted leading-relaxed">
                    Вы научитесь видеть различия не как проблему,
                    а как способ наладить общение — в семье, в команде, с детьми.
                  </p>
                </div>
              </div>
            </div>

            {/* Персональные рекомендации */}
            <div className="card p-6 border border-secondary/40">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-heading">Персональные рекомендации</h3>
                  <p className="text-muted leading-relaxed">
                    В расширенном отчёте вы получите подробное описание типа мышления,
                    профессиональных склонностей и направлений, где обычно люди с вашим типом чувствуют себя естественно.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Для кого */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary flex-shrink-0" />
            <h2 className="text-2xl font-semibold text-heading">Для кого</h2>
          </div>
          <div className="space-y-4 text-muted leading-relaxed">
            <p>Подросткам — чтобы понять себя перед выбором профессии</p>
            <p>Родителям — чтобы лучше понимать своих детей</p>
            <p>Взрослым — чтобы переосмыслить работу и вернуть ощущение "на своём месте"</p>
          </div>
        </div>

        {/* Почему это работает */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-primary flex-shrink-0" />
            <h2 className="text-2xl font-semibold text-heading">Почему это работает</h2>
          </div>
          <div className="space-y-3 text-muted leading-relaxed">
            <p>
              Потому что мы не оцениваем, не ставим рамки и не даём диагноз.
              Тест показывает, в какой среде ваша энергия течёт естественно,
              а не утекает в борьбу с собой.
            </p>
            <p>
              Это не прогноз — это зеркало вашей природы.
            </p>
          </div>
        </div>

        {/* Желаете больше контекста? */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Video className="w-6 h-6 text-primary flex-shrink-0" />
            <h2 className="text-2xl font-semibold text-heading">Желаете больше контекста?</h2>
          </div>
          <div className="space-y-3 text-muted leading-relaxed">
            <p>Посмотрите короткие видео:</p>
            <p className="text-sm italic">Названия дам по готовности самих видео</p>
          </div>
        </div>

        {/* Главная идея */}
        <div className="card p-6 border-2 border-primary/20 bg-primary/5">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-heading">Главная идея</h2>
              <div className="space-y-3 text-muted leading-relaxed">
                <p>
                  Это не тест про оценки.
                </p>
                <p>
                  Это инструмент про ясность —
                  чтобы вы, ваш ребёнок или ваша команда могли понимать себя
                  и строить жизнь в своём естественном ритме.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

