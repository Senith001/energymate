import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getPostById } from "../services/postService";
import { FiArrowLeft } from "react-icons/fi";

export default function PostDetails() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data } = await getPostById(id);
        setPost(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load the article.");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800">
        <h2 className="text-2xl font-bold mb-4">Oops!</h2>
        <p className="mb-6">{error || "Article not found."}</p>
        <Link to="/home" className="text-blue-600 hover:underline flex items-center gap-2">
          <FiArrowLeft size={16} /> Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      {/* Mini Navbar */}
      <nav className="bg-[#022c3a] text-white py-4 px-8 shadow-md sticky top-0 z-50">
        <Link to="/home" className="flex items-center gap-2 text-sm font-medium hover:text-green-400 transition-colors w-fit">
          <FiArrowLeft size={16} /> Back to EnergyMate
        </Link>
      </nav>

      {/* Article Header Image */}
      <div className="w-full h-[400px] md:h-[500px] relative bg-gray-900 border-b-4 border-green-500">
        <img 
          src={`http://localhost:5001${post.image}`} 
          alt={post.title} 
          className="w-full h-full object-cover opacity-80 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 max-w-5xl mx-auto">
          <p className="text-green-400 font-bold tracking-wider text-sm mb-3 uppercase">Featured Article</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight drop-shadow-md">
            {post.title}
          </h1>
          <p className="text-gray-300 mt-4 text-sm font-medium flex items-center gap-4">
            <span>Posted on: {new Date(post.createdAt).toLocaleDateString()}</span>
          </p>
        </div>
      </div>

      {/* Article Body */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <p className="text-xl md:text-2xl text-gray-500 font-light leading-relaxed mb-10 border-l-4 border-green-400 pl-6 italic">
          {post.summary}
        </p>

        <div className="prose prose-lg prose-green max-w-none text-gray-700 leading-loose">
          {/* If the post content uses newlines, render them. If it's markdown, this could be upgraded to a markdown parser */}
          {post.content.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-6">{paragraph}</p>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#011e28] text-gray-400 py-10 text-center text-sm border-t border-[#022c3a] mt-10">
        <p className="mb-2 font-medium">© 2026 EnergyMate - Sri Lanka Sustainable Energy Initiative.</p>
        <p className="text-xs">Developed with ❤️ for Group Project</p>
      </footer>
    </div>
  );
}
