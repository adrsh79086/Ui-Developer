import { useEffect, useState, useMemo } from "react";

const BASE_URL = "https://rickandmortyapi.com/api/character";

export default function App() {
  const [characters, setCharacters] = useState([]);
  const [info, setInfo] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [species, setSpecies] = useState("");

  const queryUrl = useMemo(() => {
    const url = new URL(BASE_URL);
    if (name.trim()) url.searchParams.set("name", name.trim());
    if (gender) url.searchParams.set("gender", gender);
    if (species) url.searchParams.set("species", species);
    return url.toString();
  }, [name, gender, species]);

  useEffect(() => {
    fetchCharacters(BASE_URL);
  }, []);

  async function fetchCharacters(url) {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 404) {
          setCharacters([]);
          setInfo(null);
          setLoading(false);
          return;
        }
        throw new Error(`Request failed (${res.status})`);
      }
      const data = await res.json();
      const results = Array.isArray(data.results) ? data.results : [];

      const firstEpisodeIds = Array.from(
        new Set(
          results
            .map((c) => c?.episode?.[0])
            .filter(Boolean)
            .map((u) => u.split("/").pop())
        )
      );

      let episodeNameById = {};
      if (firstEpisodeIds.length) {
        const epRes = await fetch(
          `https://rickandmortyapi.com/api/episode/${firstEpisodeIds.join(",")}`
        );
        if (epRes.ok) {
          const epData = await epRes.json();
          const arr = Array.isArray(epData) ? epData : [epData];
          episodeNameById = Object.fromEntries(arr.map((e) => [String(e.id), e.name]));
        }
      }

      const withFirstEpisode = results.map((c) => {
        const id = c?.episode?.[0]?.split("/").pop();
        return { ...c, firstEpisodeName: (id && episodeNameById[id]) || "Unknown" };
      });

      setCharacters(withFirstEpisode);
      setInfo(data.info || null);
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    fetchCharacters(queryUrl);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSearch();
  }

  function clearFilters() {
    setName("");
    setGender("");
    setSpecies("");
    fetchCharacters(BASE_URL);
  }

  return (
    <div className="container">
      <h1 className="title">Rick & Morty Characters</h1>

      <div className="toolbar">
        <input
          className="input"
          placeholder="Search by name… (press Enter)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <select
          className="select"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        >
          <option value="">Gender (All)</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="genderless">Genderless</option>
          <option value="unknown">Unknown</option>
        </select>

        <select
          className="select"
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
        >
          <option value="">Species (All)</option>
          <option value="Human">Human</option>
          <option value="Humanoid">Humanoid</option>
          <option value="Cronenberg">Cronenberg</option>
        </select>

        <button className="btn" onClick={handleSearch}>Search</button>
        <button className="btn btn-secondary" onClick={clearFilters}>Clear</button>
      </div>

      <div className="statusline">
        {loading && <span>Loading…</span>}
        {!loading && error && <span className="error">Error: {error}</span>}
        {!loading && !error && (
          <span>
            {info?.count ? `Found ${info.count} characters` : characters.length ? "Results" : "No results"}
          </span>
        )}
      </div>

      <div className="grid">
        {characters.map((c) => (
          <article key={c.id} className="card">
            <img className="avatar" src={c.image} alt={c.name} />
            <div className="details">
              <h2 className="name">{c.name}</h2>
              <div className="row"><strong>Gender:</strong> {c.gender}</div>
              <div className="row"><strong>Species:</strong> {c.species}</div>
              <div className="row"><strong>Location:</strong> {c.location?.name}</div>
              <div className="row"><strong>First seen in:</strong> {c.firstEpisodeName}</div>
            </div>
          </article>
        ))}
      </div>

     
<div className="pager">
  <button
    className="btn prev"
    disabled={!info?.prev || loading}
    onClick={() => fetchCharacters(info.prev)}
  >
    ← Previous
  </button>
  <button
    className="btn next"
    disabled={!info?.next || loading}
    onClick={() => fetchCharacters(info.next)}
  >
    Next →
  </button>
</div>

    </div>
  );
}
