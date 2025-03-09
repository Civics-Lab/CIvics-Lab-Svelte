<script lang="ts">
    import { ArrowRight } from '@lucide/svelte';
    import Header from '$lib/components/marketing-site/Header.svelte';
    import ContentSection from '$lib/components/marketing-site/ContentSection.svelte';
  </script>
  
  <svelte:head>
    <title>Civics Lab</title>
    <meta name="description" content="At Civics Lab, we specialize in innovative tools and expert services tailored for campaigns, county parties, and civic organizations. From strategic planning to design and education, we're your partner in building stronger movements and driving meaningful change. Explore our suite of solutions designed to make organizing smarter, faster, and more impactful." />
  </svelte:head>
  
  <div>
    <Header
      subheading="Innovate. Organize. Win."
      heading="Empowering Progress, One Campaign at a Time"
      description="At Civics Lab, we specialize in innovative tools and expert services tailored for campaigns, county parties, and civic organizations. From strategic planning to design and education, we're your partner in building stronger movements and driving meaningful change. Explore our suite of solutions designed to make organizing smarter, faster, and more impactful."
      buttonText="Explore Our Solutions"
      imageSrc="/images/header-image.jpg"
      imageAlt="Civics Lab Staff Image"
      nextSectionId="features"
    />
    
    <ContentSection
      id="features"
      subheading="Modular Solutions"
      heading="A Fully Integrated Suite of Campaign and Civic Engagement Tools"
      body="Streamline operations, empower your team, and grow your impact with a fully integrated platform. Use Civics Lab to manage campaign strategy, organize grassroots efforts, and launch (or reinvent) your approach to civic engagement and party building."
      image={{
        src: "/images/civil-rights-march.jpg",
        alt: "Civil Rights March"
      }}
    />
    
    <ContentSection
      id="compass"
      service={{
        name: "Compass",
        iconSrc: "/images/compass.svg"
      }}
      heading="Guiding Smaller Campaigns to Bigger Wins"
      body="Compass is your partner for campaign success. Designed for smaller campaigns, it offers expert planning, strategy, and a la carte services. From refining messaging to managing logistics, Compass helps you focus on connecting with your community and achieving your goals."
      primaryButton={{
        text: "Start With Compass",
        to: "/products/compass",
        type: "compass",
        trailingIcon: ArrowRight
      }}
      image={{
        src: "/images/teamwork.jpg",
        alt: "Campaign Manager Consultation Session"
      }}
    />
    
    <ContentSection
      id="helpdesk"
      service={{
        name: "Help Desk",
        iconSrc: "/images/help-desk.svg"
      }}
      heading="Support When You Need It Most"
      body="Help Desk is your dedicated resource for county parties and political campaigns. From answering questions to providing expert guidance, our community-driven service ensures you have the support you need to overcome challenges and stay on track. Empower your team with reliable assistance, whenever and wherever you need it."
      primaryButton={{
        text: "Start With Help Desk",
        to: "/products/helpdesk",
        type: "helpdesk",
        trailingIcon: ArrowRight
      }}
      image={{
        src: "/images/tech-support.jpg",
        alt: "People Helping Each Other"
      }}
    />
    
    <ContentSection
      id="engage"
      service={{
        name: "Engage",
        iconSrc: "/images/engage.svg"
      }}
      heading="Building Stronger Connections for County Parties"
      body="Engage is a purpose-built CRM designed to help county parties strengthen relationships with community members, local businesses, and donors. Streamline communications, track interactions, and organize your outreach efforts in one intuitive platform. With Engage, you can focus on growing your network and making a greater impact in your community."
      primaryButton={{
        text: "Start With Engage",
        to: "/products/engage",
        type: "engage",
        trailingIcon: ArrowRight
      }}
      image={{
        src: "/images/presentation.jpg",
        alt: "Team Educating a Group of Voters"
      }}
    />
    
    <ContentSection
      id="pathway"
      service={{
        name: "Pathway",
        iconSrc: "/images/pathway.svg"
      }}
      heading="Shaping the Future of Progressive Leadership"
      body="Pathway is an educational hub designed to train and inspire the next generation of campaign staff and civic leaders. Offering resources, courses, and expert guidance, Pathway equips aspiring progressives with the skills and knowledge to drive meaningful change. Empower your journey and pave the way for a stronger, more informed future."
      primaryButton={{
        text: "Start With Pathway",
        to: "/products/pathway",
        type: "pathway",
        trailingIcon: ArrowRight
      }}
      image={{
        src: "/images/team-education.jpg",
        alt: "Training Session"
      }}
    />
    
    <ContentSection
      id="advocacyink"
      service={{
        name: "Advocacy Ink",
        iconSrc: "/images/advocacy-ink.svg"
      }}
      heading="Printing Progress, Empowering Campaigns"
      body="Advocacy Ink is your go-to progressive print shop, specializing in campaign materials and promotional products. From yard signs to custom apparel, we provide high-quality, impactful prints that amplify your message and energize your supporters. Let us help you bring your campaign to life with products that make a difference."
      primaryButton={{
        text: "Start With Advocacy Ink",
        to: "/products/advocacy-ink",
        type: "advocacyink",
        trailingIcon: ArrowRight
      }}
      image={{
        src: "/images/screen-printing.jpg",
        alt: "Screen Printing"
      }}
    />
    
    <ContentSection
      id="call-to-action"
      heading="Start Building Your Movement Today"
      body="Create an account instantly to get started, or contact us to design a custom solution tailored to your campaign or organization."
      primaryButton={{
        text: "Start Now",
        type: "primary",
        trailingIcon: ArrowRight
      }}
      secondaryButton={{
        text: "Contact Sales",
        type: "secondary"
      }}
      image={{
        src: "/images/call-to-action-image.jpg",
        alt: "Team Planning Session"
      }}
    />
  </div>