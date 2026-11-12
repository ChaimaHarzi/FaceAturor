import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-16 bg-navy text-gray-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <div className="text-lg font-semibold text-white">Faceatutor</div>
          <p className="mt-2 text-sm leading-6">
            The e-learning platform that connects parents with expert tutors,
            guided by a dedicated mentor.
          </p>
        </div>
        <div className="text-sm">
          <div className="mb-2 font-semibold text-white">Platform</div>
          <ul className="m-0 list-none space-y-1 p-0">
            <li>
              <Link href="/#how-it-works">How it works</Link>
            </li>
            <li>
              <Link href="/#teachers">Our teachers</Link>
            </li>
            <li>
              <Link href="/register">Become a member</Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <div className="mb-2 font-semibold text-white">Contact</div>
          <p className="leading-6">
            Akouda, Sousse – Tunisia
            <br />
            contact@faceatutor.tn
          </p>
        </div>
      </div>
      <div className="border-0 border-t border-solid border-white/10 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Faceatutor. All rights reserved.
      </div>
    </footer>
  );
}
