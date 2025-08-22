import { Hero, About, Discover, Features, Steps } from "./sections/index";

const Home = () => {
  return (
    <main className="flex flex-col gap-40">
      <Hero />
      <About />
      <Discover />
      <Features />
      <Steps />
    </main>
  );
}


export default Home;