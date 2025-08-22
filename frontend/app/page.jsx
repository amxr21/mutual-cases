import { Hero, About, Discover, Features } from "./sections/index";

const Home = () => {
  return (
    <main className="flex flex-col gap-40">
      <Hero />
      <About />
      <Discover />
      <Features />
    </main>
  );
}


export default Home;