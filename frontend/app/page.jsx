import { Hero, About, Discover } from "./sections/index";

const Home = () => {
  return (
    <main className="flex flex-col gap-40">
      <Hero />
      <About />
      <Discover />
    </main>
  );
}


export default Home;