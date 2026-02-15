import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { 
  Droplets, 
  Heart, 
  Users, 
  Target, 
  TrendingUp, 
  MapPin, 
  Calendar,
  ExternalLink,
  Facebook,
  Instagram,
  Check,
  Star,
  Home,
  GraduationCap,
  Sparkles
} from 'lucide-react'
import './App.css'

function App() {
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  
  // Progress data
  const targetAmount = 5000
  const currentAmount = 7445
  const progressPercentage = Math.min((currentAmount / targetAmount) * 100, 100)
  const supporters = 50

  // Recent updates data
  const updates = [
    {
      id: 1,
      title: "Borehole Complete! 💧",
      date: "3 days ago",
      description: "The borehole is officially complete! The team has been busy putting the final touches on the borehole and the community celebrated with amazing food and music.",
      impact: "Next: Installing a second borehole for the village women's gardens",
      image: "/images/WhatsApp Image 2026-02-11 at 17.24.02.jpeg"
    },
    {
      id: 2,
      title: "Day 2 at Mandour Primary School ✨",
      date: "2 days ago", 
      description: "The team headed to Mandour Primary School to prepare funding for a new roof. Lamin Jarju officially handed over the funds to the Head Teacher - a special moment!",
      impact: "Over 70 children coached at Mandour Junior School",
      image: "/images/WhatsApp Image 2026-02-14 at 19.45.28.jpeg"
    },
    {
      id: 3,
      title: "Teacher Accommodation Progress 🏠",
      date: "5 weeks ago",
      description: "Windows and doors are now installed in the teachers accommodation block in Kasakunda village. The project is nearing completion!",
      impact: "Providing proper housing for teachers serving the community",
      image: "/images/WhatsApp Image 2026-02-13 at 20.41.18.jpeg"
    }
  ]

  // Impact statistics
  const impactStats = [
    { icon: Droplets, value: "2", label: "Boreholes Installed", color: "#3B82F6" },
    { icon: Users, value: "1000+", label: "Children Educated", color: "#10B981" },
    { icon: Heart, value: "50", label: "Supporters", color: "#EF4444" },
    { icon: Target, value: "148%", label: "Goal Achieved", color: "#F59E0B" }
  ]

  // Top donors
  const topDonors = [
    { name: "Chris Le B", amount: 250, days: 1 },
    { name: "Bertrand", amount: 150, days: 4 },
    { name: "Tom Simpson", amount: 100, days: 3, message: "Great effort Matt. Well done" }
  ]

  return (
    <div className="app">
      {/* Navigation */}
      <motion.nav 
        className="nav"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="nav-container">
          <div className="nav-logo">
            <Droplets className="logo-icon" />
            <span>Syd Wells Gambian Project</span>
          </div>
          <div className="nav-links">
            <a href="#impact">Impact</a>
            <a href="#story">Our Story</a>
            <a href="#donate" className="nav-donate-btn">Donate Now</a>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="hero">
        <motion.div 
          className="hero-overlay"
          style={{ opacity }}
        />
        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="hero-title">
              Bringing Clean Water & Education to The Gambia
            </h1>
            <p className="hero-subtitle">
              For over 30 years, we've been transforming lives in Kasakunda village and beyond through sustainable water projects, education support, and community development.
            </p>
            
            {/* Progress Card */}
            <motion.div 
              className="hero-progress-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="progress-header">
                <div>
                  <div className="progress-amount">£{currentAmount.toLocaleString()}</div>
                  <div className="progress-target">raised of £{targetAmount.toLocaleString()} goal</div>
                </div>
                <div className="progress-badge">{progressPercentage.toFixed(0)}%</div>
              </div>
              
              <div className="progress-bar-container">
                <motion.div 
                  className="progress-bar"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1.5, delay: 0.6, ease: "easeOut" }}
                />
              </div>
              
              <div className="progress-supporters">
                <Users size={16} />
                <span>{supporters} supporters</span>
              </div>
              
              <div className="hero-cta-buttons">
                <a href="#donate" className="btn-primary">
                  <Heart size={20} />
                  Donate Now
                </a>
                <a 
                  href="https://www.justgiving.com/crowdfunding/catriona-king-5" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  View on JustGiving
                  <ExternalLink size={16} />
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Video Showcase */}
      <section className="video-showcase">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="video-content"
          >
            <h2 className="section-title">See Our Impact in Action</h2>
            <p className="section-subtitle">Watch our team working directly with the communities we serve</p>
            
            <div className="videos-container">
              <div className="video-wrapper">
                <video 
                  className="impact-video"
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster="/images/WhatsApp Image 2026-02-14 at 19.45.28.jpeg"
                >
                  <source src="/images/WhatsApp Video 2026-02-11 at 17.22.43.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="video-wrapper">
                <video 
                  className="impact-video"
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster="/images/WhatsApp Image 2026-02-11 at 17.24.02.jpeg"
                >
                  <source src="/images/WhatsApp Video 2026-02-11 at 17.23.25.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Impact Statistics */}
      <section id="impact" className="impact-stats">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Our Impact</h2>
            <div className="stats-grid">
              {impactStats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="stat-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                >
                  <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                    <stat.icon size={32} />
                  </div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Our Projects & Achievements */}
      <section id="story" className="projects-section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Transforming Communities Through Action</h2>
            <p className="section-subtitle">Real projects. Real impact. Real change.</p>
          </motion.div>

          <div className="projects-grid">
            <motion.div
              className="project-card large"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="project-image">
                <img src="/images/WhatsApp Image 2026-02-11 at 17.24.02.jpeg" alt="Clean Water Access" />
                <div className="project-badge completed">Completed</div>
              </div>
              <div className="project-info">
                <h3>
                  <Droplets className="title-icon" />
                  Clean Water for Entire Villages
                </h3>
                <p>Two solar-powered boreholes now provide year-round access to clean water. No more hours-long walks to collect water. Women and children can focus on education and economic opportunities instead of water collection.</p>
                <div className="project-stat">
                  <Droplets size={20} />
                  <span>Serving 500+ families daily</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="project-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="project-image">
                <img src="/images/WhatsApp Image 2026-02-14 at 19.45.28.jpeg" alt="Football Coaching Programs" />
                <div className="project-badge">Ongoing</div>
              </div>
              <div className="project-info">
                <h3>
                  <Users className="title-icon" />
                  Youth Development & Education
                </h3>
                <p>Over 1,000 children have participated in our football coaching and educational programs, learning teamwork, discipline, and building brighter futures.</p>
                <div className="project-stat">
                  <Users size={20} />
                  <span>1000+ kids educated & coached</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="project-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="project-image">
                <img src="/images/WhatsApp Image 2026-02-13 at 20.41.18.jpeg" alt="Syd Wells School" />
                <div className="project-badge">In Progress</div>
              </div>
              <div className="project-info">
                <h3>
                  <GraduationCap className="title-icon" />
                  School Infrastructure
                </h3>
                <p>Building and renovating schools including the Syd Wells memorial school. New roofs, teacher accommodation, and facilities creating proper learning environments.</p>
                <div className="project-stat">
                  <Target size={20} />
                  <span>3 schools improved</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission-section">
        <div className="container">
          <motion.div
            className="mission-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="mission-text">
              <h2>30+ Years of Transforming Lives</h2>
              <p>
                The Syd Wells Gambian Football Project started over three decades ago with a simple mission: to support communities in The Gambia through sustainable development.
              </p>
              <p>
                Today, we're focusing on what matters most - providing clean, accessible water to villages and ensuring children have the educational facilities they deserve. Every borehole we install saves hours of daily water collection, particularly for women and girls. Every school improvement we make opens doors to better education.
              </p>
              <div className="mission-features">
                <div className="feature">
                  <Check className="feature-icon" />
                  <span>100% transparency on all donations</span>
                </div>
                <div className="feature">
                  <Check className="feature-icon" />
                  <span>Direct community partnerships</span>
                </div>
                <div className="feature">
                  <Check className="feature-icon" />
                  <span>Sustainable, long-term solutions</span>
                </div>
                <div className="feature">
                  <Check className="feature-icon" />
                  <span>Solar-powered water systems</span>
                </div>
              </div>
            </div>
            <div className="mission-image">
              <img 
                src="/images/PHOTO-2026-02-14-19-43-56.jpg" 
                alt="Volunteers in The Gambia"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sponsors Showcase */}
      <section className="sponsors-showcase">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Our Amazing Sponsors</h2>
            <p className="section-subtitle">Making it all possible through generous support</p>
            
            <div className="sponsors-images">
              <motion.div
                className="sponsor-image-card"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <img 
                  src="/images/WhatsApp Image 2026-02-14 at 09.25.07.jpeg" 
                  alt="Syd Wells Project Team and Sponsors"
                />
              </motion.div>
              <motion.div
                className="sponsor-image-card"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <img 
                  src="/images/WhatsApp Image 2026-02-14 at 19.45.19.jpeg" 
                  alt="Project Sponsors including TradeFlow and partners"
                />
              </motion.div>
            </div>
            
            <div className="sponsor-logos-text">
              <p>Proudly supported by: TradeFlow Capital Management, Carmel Crest, Advanced Maintenance UK, Mount Air Conditioning, MEC Commercial, Express Medicine Group, 113 Group, Houghton Group, ProKit, Whitestone M&E, LH Panels, and Bishop</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Top Supporters */}
      <section className="supporters-section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Top Supporters</h2>
            <p className="section-subtitle">Thank you to our generous donors</p>
            
            <div className="supporters-grid">
              {topDonors.map((donor, index) => (
                <motion.div
                  key={index}
                  className="supporter-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="supporter-header">
                    <div className="supporter-avatar">
                      {donor.name.charAt(0)}
                    </div>
                    <div>
                      <div className="supporter-name">{donor.name}</div>
                      <div className="supporter-time">{donor.days} day{donor.days > 1 ? 's' : ''} ago</div>
                    </div>
                  </div>
                  <div className="supporter-amount">£{donor.amount}</div>
                  {donor.message && <p className="supporter-message">{donor.message}</p>}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Donation CTA Section */}
      <section id="donate" className="donate-section">
        <div className="container">
          <motion.div
            className="donate-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2>Make a Difference Today</h2>
            <p>Every donation directly funds water projects and educational facilities in The Gambia. See exactly where your money goes with GPS coordinates and photos of every project.</p>
            
            <div className="donate-cards">
              <div className="donate-card">
                <div className="donate-card-icon">
                  <Droplets size={32} />
                </div>
                <h3>£50</h3>
                <p>Provides water system materials for one family</p>
              </div>
              <div className="donate-card highlight">
                <div className="donate-card-badge">Most Popular</div>
                <div className="donate-card-icon">
                  <Heart size={32} />
                </div>
                <h3>£100</h3>
                <p>Helps fund a complete borehole installation</p>
              </div>
              <div className="donate-card">
                <div className="donate-card-icon">
                  <Users size={32} />
                </div>
                <h3>£250</h3>
                <p>Supports teacher accommodation and school improvements</p>
              </div>
            </div>

            <a 
              href="https://www.justgiving.com/crowdfunding/catriona-king-5"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-donate-large"
            >
              <Heart size={24} />
              Donate via JustGiving
            </a>
            
            <p className="donate-secure">
              <Check size={16} />
              Secure donation powered by JustGiving
            </p>
          </motion.div>
        </div>
      </section>

      {/* Social & Contact */}
      <section className="social-section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Follow Our Journey</h2>
            <p className="section-subtitle">Stay updated with our latest projects and progress</p>
            
            <div className="social-links">
              <a href="https://www.instagram.com/syd_wells_gambian_project" target="_blank" rel="noopener noreferrer" className="social-link instagram">
                <Instagram size={24} />
                <span>Instagram</span>
              </a>
              <a href="https://www.facebook.com/sydwellsgambianproject" target="_blank" rel="noopener noreferrer" className="social-link facebook">
                <Facebook size={24} />
                <span>Facebook</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <Droplets size={32} />
              <span>Syd Wells Gambian Project</span>
            </div>
            <p>Transforming lives in The Gambia through clean water and education</p>
            <p className="footer-organizer">
              <MapPin size={16} />
              Organised by Catriona King · Essex, UK
            </p>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Syd Wells Gambian Project. Making a difference for over 30 years.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
