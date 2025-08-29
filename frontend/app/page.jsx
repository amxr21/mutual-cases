import { Hero, About, Discover, Features, Steps, Unique } from "./sections/index";

const Home = () => {
  return (
    <main className="flex flex-col gap-40">
      <Hero />
      <About />
      <Discover />
      <Features />
      <Steps />
      <Unique />

    </main>
  );
}


export default Home;