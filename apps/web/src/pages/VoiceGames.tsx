import { Link, useParams } from 'react-router';
import { Art } from '../art/Art';
import { Balloon } from '../art/Balloon';
import { Turtle } from '../art/Turtle';
import { ChildScreen } from '../components/ChildScreen';
import { GameShell } from '../games/GameShell';
import { TurtleBoard } from '../games/TurtleBoard';
import { BalloonBoard } from '../games/BalloonBoard';
import { SnakeBoard } from '../games/SnakeBoard';
import { BubblesBoard } from '../games/BubblesBoard';

export function VoiceGames() {
  return (
    <ChildScreen title="ألعاب الصوت">
      <div className="tiles">
        <Link className="tile sage" to="turtle"><Turtle size={96} />السلحفاة</Link>
        <Link className="tile clay" to="balloon"><div style={{ width: 56, height: 90 }}><Balloon size={0.8} color="#D2543F" wobble={false} /></div>البالونة</Link>
        <Link className="tile sun" to="snake"><Art code="1F40D" size={72} />الثعبان</Link>
        <Link className="tile sky" to="bubbles"><Art code="1FAE7" size={72} />الفقاعات</Link>
      </div>
    </ChildScreen>
  );
}

export const GAMES = {
  turtle: { title: 'السلحفاة', hint: 'السلحفاة بتمشي طول ما صوتك شغال وناعم. يلا نساعدها توصل للخس!', Board: TurtleBoard },
  balloon: { title: 'البالونة', hint: 'ابدأ صوتك ناعم خالص، زي الهمسة، والبالونة تكبر تكبر…', Board: BalloonBoard },
  snake: { title: 'الثعبان', hint: 'مطّ أول صوت في الكلمة، والثعبان يطوّل!', Board: SnakeBoard },
  bubbles: { title: 'الفقاعات', hint: 'انفخ نفخة طويلة وهادية، وشوف الفقاعات بتطلع', Board: BubblesBoard },
} as const;

export function VoiceGame() {
  const { game = '' } = useParams();
  const g = GAMES[game as keyof typeof GAMES];
  if (!g) return <VoiceGames />;
  const { Board } = g;
  return <GameShell key={game} title={g.title} hint={g.hint} render={(getLevel, finish) => <Board getLevel={getLevel} onFinish={finish} />} />;
}
