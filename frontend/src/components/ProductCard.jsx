import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/format';

function ProductCard({ product, onAddToCart }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{product.category}</p>
          <h3 className="line-clamp-1 text-lg font-bold text-slate-900">{product.name}</h3>
          <p className="line-clamp-2 text-sm text-slate-600">{product.description}</p>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <p className="text-lg font-black text-slate-900">{formatCurrency(product.price)}</p>
          <div className="flex gap-2">
            <Link
              to={`/products/${product._id}`}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              Details
            </Link>
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-600"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
