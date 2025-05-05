import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function App() {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  const [portionsMap, setPortionsMap] = useState({});
  const [staples, setStaples] = useState([]);
  const [finalList, setFinalList] = useState([]);
  const [view, setView] = useState("planner");
  const [expandedRecipe, setExpandedRecipe] = useState(null);

  const stapleItems = [
    // Oils & Sauces
    "olive oil", "worcestershire sauce", "sriracha hot sauce", "harissa oil",
  
    // Seasonings & Spices
    "salt and pepper", "black pepper", "salt", "mexican seasoning", "garlic granules",
    "paprika", "smoked paprika", "ground cumin", "cumin", "nutmeg", "mustard powder",
    "dried oregano", "oregano", "dried thyme", "thyme", "basil", "dried basil",
    "cayenne pepper", "five-spice powder", "chilli powder", "seasoning", "mixed herbs",
  
    // Herbs
    "fresh parsley", "fresh coriander", "fresh basil",
  
    // Baking & Pantry
    "plain flour", "cornflour", "butter", "unsalted butter", "sugar", "caster sugar",
    "muscovado sugar", "parmesan", "cheddar cheese", "milk", "eggs",
  
    // Stock & Tinned Goods
    "beef stock cube", "stock cube", "chicken stock", "beef stock", "vegetable stock",
    "tomato purée", "chopped tomatoes", "tinned tomatoes", "passata",
  
    // Common Carbs & Sides
    "spaghetti", "penne pasta", "tagliatelle", "short pasta", "macaroni", "risotto rice",
    "paella rice", "long grain rice", "jasmine rice", "white rice", "sticky rice",
    "microwave rice", "packet rice", "easy-cook rice", "chips", "mashed potatoes",
    "crusty bread", "brioche buns", "tortilla wraps", "flatbreads", "pitta breads",
  
    // Condiments & Extras
    "guacamole", "sour cream", "tzatziki", "salad ingredients", "jacket potato toppings"
  ];

  const categories = [
    "Fruit and Vegetables", "Meat", "Dairy", "Tinned/Cupboard", "Bakery", "Frozen"
  ];

  useEffect(() => {
    fetch("./recipes.json")
      .then(res => res.json())
      .then(data => {
        setRecipes(data.recipes);
        const defaults = {};
        data.recipes.forEach(r => { defaults[r.name] = r.portions });
        setPortionsMap(defaults);
      });
  }, []);

  const handleGenerate = () => {
    const combined = [];

    selectedRecipes.forEach(name => {
      const recipe = recipes.find(r => r.name === name);
      const scale = portionsMap[name] / recipe.portions;

      recipe.ingredients.forEach(ing => {
        const itemKey = ing.item?.toLowerCase();
        const amount = ing.amount ? Math.round(ing.amount * scale * 100) / 100 : null;
        combined.push({ item: itemKey, displayItem: ing.item, unit: ing.unit, category: ing.category, amount });
      });
    });

    const grouped = {};
    combined.forEach(i => {
      if (!i.item) return;
      const key = `${i.item}-${i.unit}-${i.category}`;
      if (!grouped[key]) grouped[key] = { ...i };
      else if (i.amount) grouped[key].amount += i.amount;
    });

    const result = Object.values(grouped).filter(i => !staples.includes(i.item));
    setFinalList(result);
  };

  const switchView = (targetView) => {
    setView(targetView);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (targetView === "recipes") setExpandedRecipe(null);
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">Meal Planner</h1>
        <div className="btn-group">
          <button className={`btn btn-outline-primary ${view === "planner" ? "active" : ""}`} onClick={() => switchView("planner")}>
            Planner
          </button>
          <button className={`btn btn-outline-primary ${view === "recipes" ? "active" : ""}`} onClick={() => switchView("recipes")}>
            Recipes
          </button>
        </div>
      </div>

      {view === "planner" && (
        <>
          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Select Recipes</h5>
              <select className="form-select" multiple size="8"
                onChange={e => {
                  const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                  setSelectedRecipes(selected);
                }}>
                {recipes.map(r => (
                  <option key={r.name} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedRecipes.map(name => (
            <div className="card mb-3 shadow-sm" key={name}>
              <div className="card-body">
                <label className="form-label">{name} – portions:</label>
                <input type="number" className="form-control" min="1"
                  value={portionsMap[name] || 1}
                  onChange={e => setPortionsMap(prev => ({ ...prev, [name]: Number(e.target.value) }))}
                />
              </div>
            </div>
          ))}

          {selectedRecipes.length > 0 && (
            <>
              <div className="card mb-4 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Staple Ingredients (tick if you already have them)</h5>
                  <div className="row">
                    {Array.from(new Set(
                      selectedRecipes.flatMap(name => {
                        const r = recipes.find(r => r.name === name);
                        return r.ingredients
                          .map(i => {
                            const item = i.item?.toLowerCase();
                            if (!item) return null;
                            if (item.includes("salt") || item.includes("pepper")) return "salt and pepper";
                            return item;
                          })
                          .filter(i => i && stapleItems.includes(i));
                      })
                    )).map(item => (
                      <div className="col-6 col-md-3 mb-2" key={item}>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={item}
                            onChange={e => {
                              setStaples(prev =>
                                e.target.checked ? [...prev, item] : prev.filter(s => s !== item)
                              );
                            }}
                          />
                          <label className="form-check-label" htmlFor={item}>
                            {item}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="d-grid mb-4">
                <button className="btn btn-primary btn-lg" onClick={handleGenerate}>
                  Generate Shopping List
                </button>
              </div>
            </>
          )}

          {finalList.length > 0 && (
            <div className="card shadow-sm mb-5">
              <div className="card-body">
                <h4>Shopping List</h4>
                {categories.map(cat => {
                  const items = finalList.filter(i => i.category === cat);
                  return items.length > 0 ? (
                    <div key={cat}>
                      <h5 className="mt-3">{cat}</h5>
                      <ul>
                        {items.map((i, idx) => (
                          <li key={idx}>
                            {i.amount ? `${Math.round(i.amount * 100) / 100} ${i.unit || ""} ` : ""}{i.item}
                            {i.prep ? ` (${i.prep})` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </>
      )}

      {view === "recipes" && (
        <>
          {recipes.map(recipe => (
            <div key={recipe.name} className="mb-4">
              <button className="btn btn-link text-start w-100" onClick={() =>
                setExpandedRecipe(prev => prev === recipe.name ? null : recipe.name)
              }>
                <h5 className="mb-0 d-flex justify-content-between align-items-center">
                  {recipe.name}
                  <span className="fs-5">{expandedRecipe === recipe.name ? "–" : "+"}</span>
                </h5>
              </button>

              {expandedRecipe === recipe.name && (
                <div className="card mt-2 shadow-sm">
                  <div className="card-body row">
                    <div className="col-md-3 border-end pe-4">
                      <div className="p-2 bg-light rounded border h-100">
                        <h6>Ingredients</h6>
                        <ul className="mb-0 small">
                          {recipe.ingredients.map((i, idx) => (
                            <li key={idx}>
                              {i.amount ? `${i.amount} ${i.unit || ""} ` : ""}{i.item}
                              {i.prep ? ` (${i.prep})` : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="col-md-9 ps-4">
                      <h6>Method</h6>
                      <pre className="mb-0" style={{ whiteSpace: "pre-wrap" }}>
                        {recipe.method}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);
