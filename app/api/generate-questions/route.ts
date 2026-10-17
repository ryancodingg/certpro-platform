export async function POST(request: Request) {
  try {
    const { topic, certification, count = 3 } = await request.json()

    // Always use mock questions to avoid quota issues
    const mockQuestions = getMockQuestions(topic, certification, count)
    return Response.json({ questions: mockQuestions })

    /* 
    // Commented out AI SDK code to prevent quota errors
    // Uncomment and configure when you have a working OpenAI API key
    
    if (!process.env.OPENAI_API_KEY) {
      const mockQuestions = getMockQuestions(topic, certification, count)
      return Response.json({ questions: mockQuestions })
    }

    const { generateText } = await import("ai")
    const { openai } = await import("@ai-sdk/openai")

    const prompt = `Generate ${count} multiple-choice questions for ${certification} certification on the topic: ${topic}...`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      system: "You are an expert certification question writer...",
    })

    const questions = JSON.parse(text)
    return Response.json({ questions })
    */
  } catch (error: any) {
    console.error("Error generating questions:", error)

    // Always fallback to mock questions if anything goes wrong
    const { topic, certification, count = 3 } = await request.json()
    const mockQuestions = getMockQuestions(topic, certification, count)

    return Response.json({ questions: mockQuestions })
  }
}

function getMockQuestions(topic: string, certification: string, count: number) {
  const questionBank = {
    "dp-700": {
      "Data Concepts": [
        {
          question: "What is the main difference between structured and unstructured data?",
          options: [
            "Structured data is always larger than unstructured data",
            "Structured data follows a predefined schema, while unstructured data does not",
            "Unstructured data is always stored in databases",
            "Structured data cannot be queried",
          ],
          correctAnswer: 1,
          explanation:
            "Structured data follows a predefined schema with organized rows and columns (like SQL databases), while unstructured data has no predefined format (like text files, images, videos).",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/architecture/data-guide/",
        },
        {
          question: "Which of the following are characteristics of Big Data? (Select all that apply)",
          options: ["Volume", "Velocity", "Variety", "Validation"],
          correctAnswer: [0, 1, 2],
          explanation:
            "The three V's of Big Data are Volume (large amounts), Velocity (high speed), and Variety (different types). Validation is not one of the traditional characteristics.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/architecture/data-guide/big-data/",
          questionType: "multiple",
        },
        {
          question: "What is data normalization in relational databases?",
          options: [
            "Converting data to a standard format",
            "Organizing data to reduce redundancy and improve integrity",
            "Encrypting sensitive data",
            "Compressing data to save storage space",
          ],
          correctAnswer: 1,
          explanation:
            "Data normalization is the process of organizing data in a database to reduce redundancy and improve data integrity by dividing large tables into smaller, related tables.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/office/troubleshoot/access/database-normalization-description",
        },
        {
          question: "What is the primary purpose of data modeling?",
          options: [
            "To create visual representations of data structures and relationships",
            "To compress data for storage efficiency",
            "To encrypt sensitive information",
            "To backup data regularly",
          ],
          correctAnswer: 0,
          explanation:
            "Data modeling creates visual representations of data structures, relationships, and constraints to help design and understand database systems.",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/architecture/data-guide/",
        },
        {
          question: "Which data format is best suited for hierarchical data?",
          options: ["CSV", "JSON", "Fixed-width text", "Binary"],
          correctAnswer: 1,
          explanation:
            "JSON (JavaScript Object Notation) is ideal for hierarchical data as it supports nested objects and arrays, making it perfect for representing complex data structures.",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/architecture/data-guide/",
        },
      ],
      "Azure Data Services": [
        {
          question: "Which Azure service is primarily designed for big data analytics and data warehousing?",
          options: ["Azure SQL Database", "Azure Cosmos DB", "Azure Synapse Analytics", "Azure Table Storage"],
          correctAnswer: 2,
          explanation:
            "Azure Synapse Analytics is Microsoft's analytics service that brings together big data and data warehousing capabilities.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/synapse-analytics/",
        },
        {
          question: "What is Azure Data Factory primarily used for?",
          options: [
            "Real-time data streaming",
            "Data orchestration and ETL processes",
            "Machine learning model training",
            "Data visualization and reporting",
          ],
          correctAnswer: 1,
          explanation:
            "Azure Data Factory is a cloud-based data integration service used for orchestrating and automating data movement and transformation (ETL/ELT processes).",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/data-factory/",
        },
        {
          question: "Which Azure services support NoSQL data storage? (Select all that apply)",
          options: ["Azure Cosmos DB", "Azure SQL Database", "Azure Table Storage", "Azure Blob Storage"],
          correctAnswer: [0, 2],
          explanation:
            "Azure Cosmos DB is a multi-model NoSQL database, and Azure Table Storage provides NoSQL key-value storage. Azure SQL Database is relational, and Blob Storage is for unstructured data.",
          topic: topic,
          difficulty: "Hard",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/cosmos-db/",
          questionType: "multiple",
        },
        {
          question: "What is the primary benefit of Azure Data Lake Storage?",
          options: [
            "Low-cost storage for structured data only",
            "Scalable storage for big data analytics with hierarchical namespace",
            "Real-time data processing capabilities",
            "Built-in machine learning algorithms",
          ],
          correctAnswer: 1,
          explanation:
            "Azure Data Lake Storage provides scalable, cost-effective storage optimized for big data analytics with a hierarchical namespace that enables efficient data organization.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/storage/blobs/data-lake-storage-introduction",
        },
        {
          question: "Which Azure service provides serverless SQL querying capabilities?",
          options: ["Azure SQL Database", "Azure Synapse Serverless SQL Pool", "Azure Cosmos DB", "Azure Data Factory"],
          correctAnswer: 1,
          explanation:
            "Azure Synapse Serverless SQL Pool allows you to query data in your data lake using T-SQL without provisioning dedicated resources.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/synapse-analytics/sql/on-demand-workspace-overview",
        },
      ],
      "Data Analytics": [
        {
          question: "What is the primary purpose of data visualization?",
          options: [
            "To compress data for storage",
            "To make data insights more accessible and understandable",
            "To encrypt sensitive information",
            "To backup data automatically",
          ],
          correctAnswer: 1,
          explanation:
            "Data visualization transforms complex data into visual formats like charts and graphs to make insights more accessible and easier to understand for decision-making.",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/power-bi/fundamentals/power-bi-overview",
        },
        {
          question: "Which types of analytics help predict future outcomes? (Select all that apply)",
          options: ["Descriptive Analytics", "Predictive Analytics", "Prescriptive Analytics", "Diagnostic Analytics"],
          correctAnswer: [1, 2],
          explanation:
            "Predictive Analytics forecasts future outcomes using historical data, while Prescriptive Analytics recommends actions to achieve desired outcomes. Descriptive and Diagnostic analytics focus on past events.",
          topic: topic,
          difficulty: "Hard",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/architecture/data-guide/",
          questionType: "multiple",
        },
        {
          question: "What is a key characteristic of real-time analytics?",
          options: [
            "Data is processed in large batches",
            "Results are available within seconds or milliseconds",
            "Data is stored for long-term analysis",
            "Processing happens once per day",
          ],
          correctAnswer: 1,
          explanation:
            "Real-time analytics processes data as it arrives, providing results within seconds or milliseconds to enable immediate decision-making and responses.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/stream-analytics/",
        },
        {
          question: "What is the difference between OLTP and OLAP systems?",
          options: [
            "OLTP is for analytics, OLAP is for transactions",
            "OLTP handles transactions, OLAP handles analytical processing",
            "They are the same thing",
            "OLTP is newer than OLAP",
          ],
          correctAnswer: 1,
          explanation:
            "OLTP (Online Transaction Processing) systems handle day-to-day transactions, while OLAP (Online Analytical Processing) systems are optimized for complex analytical queries and reporting.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/architecture/data-guide/",
        },
        {
          question: "Which Azure service is best for creating interactive dashboards and reports?",
          options: ["Azure Data Factory", "Power BI", "Azure Synapse Analytics", "Azure Cosmos DB"],
          correctAnswer: 1,
          explanation:
            "Power BI is Microsoft's business intelligence platform designed for creating interactive dashboards, reports, and data visualizations.",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/power-bi/",
        },
      ],
      "Data Visualization": [
        {
          question: "Which chart type is best for showing trends over time?",
          options: ["Pie chart", "Line chart", "Bar chart", "Scatter plot"],
          correctAnswer: 1,
          explanation:
            "Line charts are ideal for displaying trends and changes over time, as they clearly show the progression of values across a continuous timeline.",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/power-bi/visuals/",
        },
        {
          question: "What are the key principles of effective data visualization? (Select all that apply)",
          options: ["Clarity", "Accuracy", "Complexity", "Relevance"],
          correctAnswer: [0, 1, 3],
          explanation:
            "Effective data visualization should be clear, accurate, and relevant to the audience. Complexity should be avoided in favor of simplicity and understanding.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/power-bi/guidance/",
          questionType: "multiple",
        },
        {
          question: "When should you use a scatter plot?",
          options: [
            "To show parts of a whole",
            "To display relationships between two numerical variables",
            "To compare categories",
            "To show trends over time",
          ],
          correctAnswer: 1,
          explanation:
            "Scatter plots are used to visualize the relationship or correlation between two numerical variables, helping identify patterns, clusters, or outliers.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/power-bi/visuals/",
        },
        {
          question: "What is the purpose of using color in data visualization?",
          options: [
            "To make charts look more attractive",
            "To encode additional information and improve understanding",
            "To use as many colors as possible",
            "To match company branding only",
          ],
          correctAnswer: 1,
          explanation:
            "Color in data visualization should encode meaningful information, highlight important data points, and improve the overall understanding of the data being presented.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/power-bi/guidance/",
        },
        {
          question: "Which visualization is most appropriate for showing hierarchical data?",
          options: ["Line chart", "Treemap", "Histogram", "Box plot"],
          correctAnswer: 1,
          explanation:
            "Treemaps are excellent for displaying hierarchical data, showing both the hierarchy and relative sizes of different categories through nested rectangles.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/power-bi/visuals/",
        },
      ],
    },
    "az-900": {
      "Cloud Concepts": [
        {
          question: "What is the primary benefit of cloud computing?",
          options: [
            "Reduced security",
            "On-demand scalability and cost efficiency",
            "Increased hardware maintenance",
            "Limited accessibility",
          ],
          correctAnswer: 1,
          explanation:
            "Cloud computing provides on-demand scalability, cost efficiency, and eliminates the need for physical hardware maintenance.",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/architecture/framework/",
        },
        {
          question: "Which cloud deployment models exist? (Select all that apply)",
          options: ["Public Cloud", "Private Cloud", "Hybrid Cloud", "Community Cloud"],
          correctAnswer: [0, 1, 2, 3],
          explanation:
            "All four are valid cloud deployment models: Public (shared infrastructure), Private (dedicated infrastructure), Hybrid (combination), and Community (shared by specific community).",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/architecture/guide/",
          questionType: "multiple",
        },
        {
          question: "What does 'elasticity' mean in cloud computing?",
          options: [
            "The ability to stretch physical servers",
            "Automatic scaling of resources based on demand",
            "The flexibility of payment options",
            "The ability to move between cloud providers",
          ],
          correctAnswer: 1,
          explanation:
            "Elasticity refers to the cloud's ability to automatically scale resources up or down based on current demand, ensuring optimal performance and cost efficiency.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/architecture/framework/scalability/",
        },
        {
          question: "What is the difference between scalability and elasticity?",
          options: [
            "They are the same concept",
            "Scalability is manual, elasticity is automatic",
            "Scalability is for storage, elasticity is for compute",
            "Elasticity is more expensive than scalability",
          ],
          correctAnswer: 1,
          explanation:
            "Scalability refers to the ability to handle increased load (can be manual or automatic), while elasticity specifically refers to automatic scaling based on demand.",
          topic: topic,
          difficulty: "Hard",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/architecture/framework/scalability/",
        },
        {
          question: "Which of the following are advantages of cloud computing? (Select all that apply)",
          options: ["Cost savings", "Global reach", "Increased security risks", "Automatic updates"],
          correctAnswer: [0, 1, 3],
          explanation:
            "Cloud computing offers cost savings, global reach, and automatic updates. When properly configured, it typically reduces rather than increases security risks.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/architecture/framework/",
          questionType: "multiple",
        },
      ],
      "Azure Services": [
        {
          question: "Which Azure service provides virtual machines?",
          options: ["Azure App Service", "Azure Functions", "Azure Virtual Machines", "Azure Container Instances"],
          correctAnswer: 2,
          explanation:
            "Azure Virtual Machines provides Infrastructure-as-a-Service (IaaS) by offering virtualized computing resources in the cloud.",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/virtual-machines/",
        },
        {
          question: "What is Azure Resource Manager (ARM)?",
          options: [
            "A monitoring service",
            "The deployment and management service for Azure",
            "A storage service",
            "A networking service",
          ],
          correctAnswer: 1,
          explanation:
            "Azure Resource Manager is the deployment and management service for Azure that provides a consistent management layer for creating, updating, and deleting resources.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/azure-resource-manager/",
        },
        {
          question: "Which Azure services are considered Platform-as-a-Service (PaaS)? (Select all that apply)",
          options: ["Azure Virtual Machines", "Azure App Service", "Azure SQL Database", "Azure Functions"],
          correctAnswer: [1, 2, 3],
          explanation:
            "Azure App Service, Azure SQL Database, and Azure Functions are PaaS services. Azure Virtual Machines is Infrastructure-as-a-Service (IaaS).",
          topic: topic,
          difficulty: "Hard",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/architecture/guide/",
          questionType: "multiple",
        },
        {
          question: "What is the primary purpose of Azure Load Balancer?",
          options: [
            "To store data across multiple regions",
            "To distribute incoming traffic across multiple resources",
            "To monitor application performance",
            "To manage user authentication",
          ],
          correctAnswer: 1,
          explanation:
            "Azure Load Balancer distributes incoming network traffic across multiple backend resources to ensure high availability and reliability.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/load-balancer/",
        },
        {
          question: "Which Azure service provides serverless computing?",
          options: ["Azure Virtual Machines", "Azure App Service", "Azure Functions", "Azure Container Instances"],
          correctAnswer: 2,
          explanation:
            "Azure Functions provides serverless computing, allowing you to run code without managing infrastructure, and you only pay for the compute time consumed.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/azure-functions/",
        },
      ],
      Security: [
        {
          question: "What is Azure Active Directory (Azure AD)?",
          options: [
            "A file storage service",
            "Microsoft's cloud-based identity and access management service",
            "A virtual networking service",
            "A database service",
          ],
          correctAnswer: 1,
          explanation:
            "Azure Active Directory is Microsoft's cloud-based identity and access management service that helps employees sign in and access resources.",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/active-directory/",
        },
        {
          question: "Which security features are provided by Azure? (Select all that apply)",
          options: [
            "Multi-factor Authentication",
            "Role-based Access Control",
            "Network Security Groups",
            "Antivirus Software",
          ],
          correctAnswer: [0, 1, 2],
          explanation:
            "Azure provides MFA, RBAC, and NSGs as built-in security features. While antivirus can be deployed on VMs, it's not a native Azure security service.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/security/",
          questionType: "multiple",
        },
        {
          question: "What is the principle of least privilege?",
          options: [
            "Giving users maximum access to reduce support tickets",
            "Providing users with only the minimum access necessary to perform their job",
            "Allowing all users to access all resources",
            "Restricting access only to administrators",
          ],
          correctAnswer: 1,
          explanation:
            "The principle of least privilege means providing users with only the minimum level of access necessary to perform their job functions, reducing security risks.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/security/fundamentals/",
        },
        {
          question: "What is Azure Key Vault used for?",
          options: [
            "Storing virtual machine images",
            "Managing secrets, keys, and certificates",
            "Load balancing web traffic",
            "Monitoring application performance",
          ],
          correctAnswer: 1,
          explanation:
            "Azure Key Vault is a cloud service for securely storing and managing secrets, encryption keys, and certificates used by applications and services.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/key-vault/",
        },
        {
          question: "What does defense in depth mean in cloud security?",
          options: [
            "Using only one strong security measure",
            "Implementing multiple layers of security controls",
            "Focusing only on perimeter security",
            "Relying solely on Azure's built-in security",
          ],
          correctAnswer: 1,
          explanation:
            "Defense in depth is a security strategy that uses multiple layers of security controls throughout an IT system to protect against various types of attacks.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/security/fundamentals/",
        },
      ],
      "Pricing & Support": [
        {
          question: "Which factors affect Azure pricing? (Select all that apply)",
          options: ["Resource type", "Usage amount", "Location/Region", "Time of day"],
          correctAnswer: [0, 1, 2],
          explanation:
            "Azure pricing is affected by resource type, usage amount, and location/region. Time of day typically doesn't affect pricing (except for some spot pricing scenarios).",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/cost-management-billing/",
          questionType: "multiple",
        },
        {
          question: "What is the Azure pricing calculator used for?",
          options: [
            "To monitor current spending",
            "To estimate costs for Azure services before deployment",
            "To automatically optimize costs",
            "To generate invoices",
          ],
          correctAnswer: 1,
          explanation:
            "The Azure pricing calculator helps estimate costs for Azure services before deployment, allowing you to plan and budget for your cloud resources.",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://azure.microsoft.com/en-us/pricing/calculator/",
        },
        {
          question: "What is the difference between CapEx and OpEx in cloud computing?",
          options: [
            "CapEx is for cloud, OpEx is for on-premises",
            "CapEx is upfront investment, OpEx is ongoing operational costs",
            "They are the same thing",
            "OpEx is more expensive than CapEx",
          ],
          correctAnswer: 1,
          explanation:
            "CapEx (Capital Expenditure) involves upfront investments in physical infrastructure, while OpEx (Operational Expenditure) involves ongoing costs for services, which is typical in cloud computing.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/architecture/framework/cost/",
        },
        {
          question: "Which Azure support plans are available? (Select all that apply)",
          options: ["Basic", "Developer", "Standard", "Professional Direct"],
          correctAnswer: [0, 1, 2, 3],
          explanation:
            "Azure offers Basic (free), Developer, Standard, and Professional Direct support plans, each with different levels of support and response times.",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://azure.microsoft.com/en-us/support/plans/",
          questionType: "multiple",
        },
        {
          question: "What is Azure Cost Management used for?",
          options: [
            "To deploy resources automatically",
            "To monitor, allocate, and optimize cloud costs",
            "To manage user permissions",
            "To backup data",
          ],
          correctAnswer: 1,
          explanation:
            "Azure Cost Management helps monitor, allocate, and optimize cloud spending through cost analysis, budgets, and recommendations.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.microsoft.com/en-us/azure/cost-management-billing/",
        },
      ],
    },
    "aws-clf-c02": {
      "AWS Services": [
        {
          question: "Which AWS service provides object storage?",
          options: ["Amazon EBS", "Amazon S3", "Amazon EFS", "Amazon RDS"],
          correctAnswer: 1,
          explanation:
            "Amazon S3 (Simple Storage Service) is an object storage service that offers industry-leading scalability, data availability, security, and performance.",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://docs.aws.amazon.com/s3/",
        },
        {
          question: "What is Amazon EC2?",
          options: [
            "A database service",
            "A virtual server service",
            "A content delivery network",
            "A monitoring service",
          ],
          correctAnswer: 1,
          explanation:
            "Amazon EC2 (Elastic Compute Cloud) provides scalable virtual servers in the cloud, allowing you to run applications on AWS infrastructure.",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://docs.aws.amazon.com/ec2/",
        },
        {
          question: "Which AWS services are considered serverless? (Select all that apply)",
          options: ["AWS Lambda", "Amazon EC2", "Amazon S3", "Amazon DynamoDB"],
          correctAnswer: [0, 3],
          explanation:
            "AWS Lambda and Amazon DynamoDB are serverless services. EC2 requires server management, and while S3 is managed, it's not typically classified as serverless computing.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://aws.amazon.com/serverless/",
          questionType: "multiple",
        },
        {
          question: "What is Amazon RDS?",
          options: [
            "A NoSQL database service",
            "A relational database service",
            "A data warehouse service",
            "A file storage service",
          ],
          correctAnswer: 1,
          explanation:
            "Amazon RDS (Relational Database Service) is a managed relational database service that supports multiple database engines like MySQL, PostgreSQL, and SQL Server.",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://docs.aws.amazon.com/rds/",
        },
        {
          question: "Which AWS service provides a content delivery network (CDN)?",
          options: ["Amazon S3", "Amazon CloudFront", "Amazon Route 53", "Amazon VPC"],
          correctAnswer: 1,
          explanation:
            "Amazon CloudFront is AWS's content delivery network service that delivers content to users with low latency and high transfer speeds.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.aws.amazon.com/cloudfront/",
        },
      ],
      "Cloud Concepts": [
        {
          question: "What are the benefits of cloud computing? (Select all that apply)",
          options: [
            "Trade capital expense for variable expense",
            "Benefit from massive economies of scale",
            "Eliminate guessing capacity",
            "Increase speed and agility",
          ],
          correctAnswer: [0, 1, 2, 3],
          explanation:
            "All listed options are key benefits of cloud computing: converting CapEx to OpEx, economies of scale, eliminating capacity guessing, and increased agility.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.aws.amazon.com/whitepapers/latest/aws-overview/",
          questionType: "multiple",
        },
        {
          question: "What is the AWS Well-Architected Framework?",
          options: [
            "A physical building design",
            "A set of best practices for designing and operating reliable, secure, efficient systems",
            "A pricing model",
            "A deployment tool",
          ],
          correctAnswer: 1,
          explanation:
            "The AWS Well-Architected Framework provides best practices for designing and operating reliable, secure, efficient, and cost-effective systems in the cloud.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.aws.amazon.com/wellarchitected/",
        },
        {
          question: "What does high availability mean in cloud computing?",
          options: [
            "Systems are always 100% available",
            "Systems are designed to remain operational with minimal downtime",
            "Systems are very expensive",
            "Systems require constant monitoring",
          ],
          correctAnswer: 1,
          explanation:
            "High availability means systems are designed to remain operational and accessible with minimal downtime, typically through redundancy and failover mechanisms.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl:
            "https://docs.aws.amazon.com/whitepapers/latest/real-time-communication-on-aws/high-availability-and-scalability-on-aws.html",
        },
        {
          question: "What is fault tolerance in cloud architecture?",
          options: [
            "The ability to prevent all failures",
            "The ability to continue operating despite component failures",
            "The ability to reduce costs",
            "The ability to scale automatically",
          ],
          correctAnswer: 1,
          explanation:
            "Fault tolerance is the ability of a system to continue operating properly in the event of component failures, often through redundancy and automatic failover.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/",
        },
        {
          question: "What is the difference between horizontal and vertical scaling?",
          options: [
            "Horizontal adds more instances, vertical increases instance size",
            "Horizontal increases instance size, vertical adds more instances",
            "They are the same thing",
            "Horizontal is for databases, vertical is for web servers",
          ],
          correctAnswer: 0,
          explanation:
            "Horizontal scaling (scale out) adds more instances to handle load, while vertical scaling (scale up) increases the size/capacity of existing instances.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.aws.amazon.com/autoscaling/",
        },
      ],
      Security: [
        {
          question: "What is the AWS Shared Responsibility Model?",
          options: [
            "AWS is responsible for everything",
            "Customer is responsible for everything",
            "AWS secures the cloud infrastructure, customer secures their data and applications",
            "Responsibilities are shared equally",
          ],
          correctAnswer: 2,
          explanation:
            "In the AWS Shared Responsibility Model, AWS is responsible for security 'of' the cloud (infrastructure), while customers are responsible for security 'in' the cloud (their data and applications).",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl:
            "https://docs.aws.amazon.com/whitepapers/latest/aws-security-best-practices/shared-responsibility-model.html",
        },
        {
          question: "Which AWS service helps manage user identities and access?",
          options: ["Amazon S3", "AWS IAM", "Amazon EC2", "Amazon RDS"],
          correctAnswer: 1,
          explanation:
            "AWS IAM (Identity and Access Management) enables you to manage access to AWS services and resources securely by controlling user identities and permissions.",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://docs.aws.amazon.com/iam/",
        },
        {
          question: "What are the components of AWS IAM? (Select all that apply)",
          options: ["Users", "Groups", "Roles", "Policies"],
          correctAnswer: [0, 1, 2, 3],
          explanation:
            "AWS IAM consists of Users (individual identities), Groups (collections of users), Roles (assumable identities), and Policies (permission documents).",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.aws.amazon.com/iam/",
          questionType: "multiple",
        },
        {
          question: "What is Multi-Factor Authentication (MFA)?",
          options: [
            "Using multiple passwords",
            "An additional layer of security requiring multiple forms of verification",
            "Having multiple user accounts",
            "Using different browsers",
          ],
          correctAnswer: 1,
          explanation:
            "MFA adds an extra layer of security by requiring multiple forms of verification (something you know, have, or are) before granting access.",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://docs.aws.amazon.com/iam/latest/userguide/id_credentials_mfa.html",
        },
        {
          question: "Which AWS service provides DDoS protection?",
          options: ["AWS WAF", "AWS Shield", "Amazon CloudFront", "AWS Config"],
          correctAnswer: 1,
          explanation:
            "AWS Shield provides DDoS (Distributed Denial of Service) protection for AWS resources, with Shield Standard included free and Shield Advanced available for enhanced protection.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.aws.amazon.com/shield/",
        },
      ],
      "Billing & Pricing": [
        {
          question: "What is the AWS Free Tier?",
          options: [
            "A completely free version of AWS",
            "Limited free usage of AWS services for new customers",
            "A discount program for students",
            "Free support from AWS",
          ],
          correctAnswer: 1,
          explanation:
            "The AWS Free Tier provides limited free usage of many AWS services for 12 months after account creation, plus some services that are always free.",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://aws.amazon.com/free/",
        },
        {
          question: "Which AWS pricing models are available? (Select all that apply)",
          options: ["Pay-as-you-go", "Reserved Instances", "Spot Instances", "Dedicated Hosts"],
          correctAnswer: [0, 1, 2, 3],
          explanation:
            "AWS offers multiple pricing models: Pay-as-you-go (on-demand), Reserved Instances (commitment discounts), Spot Instances (unused capacity), and Dedicated Hosts (physical servers).",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.aws.amazon.com/whitepapers/latest/how-aws-pricing-works/",
          questionType: "multiple",
        },
        {
          question: "What is AWS Cost Explorer?",
          options: [
            "A service to deploy resources",
            "A tool to visualize and manage AWS costs and usage",
            "A monitoring service",
            "A security service",
          ],
          correctAnswer: 1,
          explanation:
            "AWS Cost Explorer is a tool that enables you to view and analyze your AWS costs and usage over time, helping you understand spending patterns and identify cost optimization opportunities.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html",
        },
        {
          question: "What are AWS Reserved Instances?",
          options: [
            "Instances that are always running",
            "A pricing model offering significant discounts for committed usage",
            "Instances with guaranteed performance",
            "Instances in specific regions only",
          ],
          correctAnswer: 1,
          explanation:
            "AWS Reserved Instances provide significant cost savings (up to 75%) compared to on-demand pricing in exchange for a commitment to use specific instance types in specific regions for 1 or 3 years.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-reserved-instances.html",
        },
        {
          question: "What factors affect AWS pricing? (Select all that apply)",
          options: ["Compute time", "Data transfer", "Storage used", "Number of requests"],
          correctAnswer: [0, 1, 2, 3],
          explanation:
            "AWS pricing is typically based on multiple factors including compute time, data transfer (especially outbound), storage used, and number of requests/operations.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.aws.amazon.com/whitepapers/latest/how-aws-pricing-works/",
          questionType: "multiple",
        },
      ],
    },
    // DATABRICKS QUESTION BANK - COMPLETE IMPLEMENTATION
    "databricks-certified-associate-developer": {
      "Apache Spark": [
        {
          question: "What is the main benefit of using Spark DataFrames over RDDs?",
          options: [
            "DataFrames are faster in all scenarios",
            "DataFrames provide a higher-level API with optimizations",
            "DataFrames use less memory",
            "DataFrames support more programming languages",
          ],
          correctAnswer: 1,
          explanation:
            "DataFrames provide a higher-level API with Catalyst optimizer and Tungsten execution engine optimizations.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/spark/latest/dataframes-datasets/",
        },
        {
          question: "Which Spark operation is a transformation? (Select all that apply)",
          options: ["filter()", "collect()", "map()", "show()"],
          correctAnswer: [0, 2],
          explanation:
            "filter() and map() are transformations that return new DataFrames/RDDs. collect() and show() are actions that trigger computation.",
          topic: topic,
          difficulty: "Hard",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/spark/latest/rdd-streaming/",
          questionType: "multiple",
        },
        {
          question: "What is lazy evaluation in Apache Spark?",
          options: [
            "Spark processes data slowly",
            "Transformations are not executed until an action is called",
            "Spark waits for user input",
            "Spark only processes small datasets",
          ],
          correctAnswer: 1,
          explanation:
            "Lazy evaluation means that transformations are not executed immediately but are recorded as a lineage. Execution only happens when an action is called.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/spark/latest/dataframes-datasets/",
        },
        {
          question: "Which of the following are Spark actions? (Select all that apply)",
          options: ["count()", "filter()", "collect()", "save()"],
          correctAnswer: [0, 2, 3],
          explanation:
            "count(), collect(), and save() are actions that trigger computation. filter() is a transformation.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/spark/latest/rdd-streaming/",
          questionType: "multiple",
        },
        {
          question: "What is the Spark driver?",
          options: [
            "A database connector",
            "The main program that coordinates the Spark application",
            "A storage system",
            "A monitoring tool",
          ],
          correctAnswer: 1,
          explanation:
            "The Spark driver is the main program that runs the main() function of the application and coordinates the execution of tasks across the cluster.",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/spark/latest/spark-sql/",
        },
      ],
      "Data Engineering": [
        {
          question: "Which Databricks feature helps with data pipeline orchestration?",
          options: ["Databricks Jobs", "Databricks SQL", "Databricks Connect", "Databricks CLI"],
          correctAnswer: 0,
          explanation:
            "Databricks Jobs provides workflow orchestration capabilities for scheduling and managing data pipelines.",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/jobs/",
        },
        {
          question: "What is the purpose of Delta Lake?",
          options: [
            "To provide a web interface",
            "To add ACID transactions and versioning to data lakes",
            "To compress data",
            "To encrypt data",
          ],
          correctAnswer: 1,
          explanation:
            "Delta Lake brings ACID transactions, scalable metadata handling, and unifies streaming and batch data processing on top of existing data lakes.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/delta/",
        },
        {
          question: "Which file formats are commonly used in data engineering? (Select all that apply)",
          options: ["Parquet", "JSON", "CSV", "Avro"],
          correctAnswer: [0, 1, 2, 3],
          explanation:
            "All these formats are commonly used: Parquet (columnar), JSON (semi-structured), CSV (simple tabular), and Avro (schema evolution).",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/data/data-sources/",
          questionType: "multiple",
        },
        {
          question: "What is the benefit of using Parquet format?",
          options: [
            "Human readable format",
            "Columnar storage with compression and fast queries",
            "Supports schema evolution",
            "Works with all programming languages",
          ],
          correctAnswer: 1,
          explanation:
            "Parquet is a columnar storage format that provides excellent compression and fast query performance, especially for analytical workloads.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/data/data-sources/read-parquet.html",
        },
        {
          question: "What is data partitioning in Spark?",
          options: [
            "Splitting data across multiple files based on column values",
            "Encrypting sensitive data",
            "Compressing data to save space",
            "Converting data types",
          ],
          correctAnswer: 0,
          explanation:
            "Data partitioning involves splitting data across multiple files or directories based on column values to improve query performance and enable partition pruning.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/delta/optimizations/file-mgmt.html",
        },
      ],
      "Databricks Platform": [
        {
          question: "Which of the following are key features of Databricks? (Select all that apply)",
          options: [
            "Collaborative notebooks",
            "Auto-scaling clusters",
            "Built-in machine learning",
            "Only supports Python",
          ],
          correctAnswer: [0, 1, 2],
          explanation:
            "Databricks provides collaborative notebooks, auto-scaling clusters, and built-in ML capabilities. It supports multiple languages including Python, Scala, R, and SQL.",
          topic: topic,
          difficulty: "Hard",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/getting-started/",
          questionType: "multiple",
        },
        {
          question: "What is a Databricks cluster?",
          options: [
            "A group of databases",
            "A set of computation resources and configurations",
            "A collection of notebooks",
            "A storage system",
          ],
          correctAnswer: 1,
          explanation:
            "A Databricks cluster is a set of computation resources and configurations on which you run data engineering, data science, and analytics workloads.",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/clusters/",
        },
        {
          question: "What are the types of Databricks clusters? (Select all that apply)",
          options: ["All-purpose clusters", "Job clusters", "Interactive clusters", "SQL warehouses"],
          correctAnswer: [0, 1, 3],
          explanation:
            "Databricks has all-purpose clusters (for interactive work), job clusters (for automated jobs), and SQL warehouses (for SQL analytics). 'Interactive clusters' is not a specific type.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/clusters/",
          questionType: "multiple",
        },
        {
          question: "What is Databricks Runtime?",
          options: [
            "The time it takes to run a job",
            "A set of core components that run on Databricks clusters",
            "A monitoring tool",
            "A storage format",
          ],
          correctAnswer: 1,
          explanation:
            "Databricks Runtime is a set of core components that run on Databricks clusters, including Apache Spark and additional libraries and optimizations.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/runtime/",
        },
        {
          question: "What is the purpose of Databricks notebooks?",
          options: [
            "To store data permanently",
            "To provide an interactive environment for data analysis and collaboration",
            "To monitor cluster performance",
            "To manage user permissions",
          ],
          correctAnswer: 1,
          explanation:
            "Databricks notebooks provide an interactive, collaborative environment for data analysis, supporting multiple languages and rich visualizations.",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/notebooks/",
        },
      ],
      "ETL Pipelines": [
        {
          question: "What is the recommended way to handle schema evolution in Databricks ETL pipelines?",
          options: [
            "Always drop and recreate tables",
            "Use Delta Lake with schema enforcement and evolution",
            "Store all data as strings",
            "Avoid schema changes entirely",
          ],
          correctAnswer: 1,
          explanation:
            "Delta Lake provides schema enforcement to prevent bad data and schema evolution to safely evolve table schemas over time.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/delta/schema-evolution.html",
        },
        {
          question: "What are the stages of a typical ETL pipeline? (Select all that apply)",
          options: ["Extract", "Transform", "Load", "Monitor"],
          correctAnswer: [0, 1, 2],
          explanation:
            "ETL stands for Extract (data from sources), Transform (clean and process), and Load (into target systems). Monitoring is important but not part of the core ETL process.",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/getting-started/etl-quick-start.html",
          questionType: "multiple",
        },
        {
          question: "What is the difference between ETL and ELT?",
          options: [
            "They are the same thing",
            "ETL transforms before loading, ELT loads before transforming",
            "ETL is faster than ELT",
            "ELT is only for small datasets",
          ],
          correctAnswer: 1,
          explanation:
            "ETL transforms data before loading it into the target system, while ELT loads raw data first and then transforms it in the target system.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/getting-started/etl-quick-start.html",
        },
        {
          question: "Which Databricks features help with data quality? (Select all that apply)",
          options: ["Delta Lake constraints", "Data expectations", "Schema enforcement", "Auto Loader"],
          correctAnswer: [0, 2],
          explanation:
            "Delta Lake constraints and schema enforcement directly help with data quality. Auto Loader helps with incremental data ingestion but not specifically data quality.",
          topic: topic,
          difficulty: "Hard",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/delta/",
          questionType: "multiple",
        },
        {
          question: "What is Databricks Auto Loader?",
          options: [
            "A tool for automatic cluster scaling",
            "An incremental and efficient data ingestion service",
            "A data visualization tool",
            "A machine learning feature",
          ],
          correctAnswer: 1,
          explanation:
            "Auto Loader incrementally and efficiently processes new data files as they arrive in cloud storage, making it ideal for streaming ETL pipelines.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/ingestion/auto-loader/",
        },
      ],
    },
    "databricks-certified-data-engineer-associate": {
      "Lakehouse Architecture": [
        {
          question:
            "Which of the following are key components of the Databricks Lakehouse Platform? (Select all that apply)",
          options: ["Delta Lake", "Unity Catalog", "MLflow", "Apache Kafka"],
          correctAnswer: [0, 1, 2],
          explanation:
            "Delta Lake, Unity Catalog, and MLflow are core components of the Databricks Lakehouse Platform. Apache Kafka is a separate streaming platform.",
          topic: topic,
          difficulty: "Hard",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/lakehouse/",
          questionType: "multiple",
        },
        {
          question: "What is the primary advantage of a Lakehouse architecture?",
          options: [
            "Lower storage costs only",
            "Combines benefits of data lakes and data warehouses",
            "Faster data ingestion only",
            "Better security only",
          ],
          correctAnswer: 1,
          explanation:
            "Lakehouse architecture combines the flexibility and cost-effectiveness of data lakes with the performance and reliability of data warehouses.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/lakehouse/",
        },
        {
          question: "What problems does the Lakehouse architecture solve? (Select all that apply)",
          options: ["Data silos", "Stale data", "Complex architecture", "High costs"],
          correctAnswer: [0, 1, 2],
          explanation:
            "Lakehouse architecture addresses data silos by unifying storage, reduces stale data through real-time capabilities, and simplifies complex multi-system architectures.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/lakehouse/",
          questionType: "multiple",
        },
        {
          question: "What is Unity Catalog in Databricks?",
          options: [
            "A data visualization tool",
            "A unified governance solution for data and AI",
            "A cluster management service",
            "A machine learning platform",
          ],
          correctAnswer: 1,
          explanation:
            "Unity Catalog provides unified governance for data and AI assets across Databricks workspaces, including access control, auditing, and lineage.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/data-governance/unity-catalog/",
        },
        {
          question: "Which storage formats are optimized for Lakehouse architecture?",
          options: ["CSV and JSON only", "Delta Lake and Iceberg", "XML and YAML", "Binary formats only"],
          correctAnswer: 1,
          explanation:
            "Open table formats like Delta Lake and Apache Iceberg are optimized for Lakehouse architecture, providing ACID transactions and metadata management.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/delta/",
        },
      ],
      "Delta Lake": [
        {
          question: "What does Delta Lake's time travel feature allow you to do?",
          options: [
            "Query historical versions of data",
            "Predict future data trends",
            "Compress data more efficiently",
            "Replicate data across regions",
          ],
          correctAnswer: 0,
          explanation:
            "Delta Lake's time travel allows you to query, rollback to, or clone historical versions of your data.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/delta/history.html",
        },
        {
          question: "Which Delta Lake features help ensure data quality? (Select all that apply)",
          options: ["ACID transactions", "Schema enforcement", "Time travel", "Automatic compaction"],
          correctAnswer: [0, 1],
          explanation:
            "ACID transactions and schema enforcement directly help ensure data quality by preventing corrupt writes and bad data.",
          topic: topic,
          difficulty: "Hard",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/delta/",
          questionType: "multiple",
        },
        {
          question: "What is Delta Lake's VACUUM command used for?",
          options: [
            "Cleaning up old data files that are no longer referenced",
            "Compressing data files",
            "Updating table statistics",
            "Creating table backups",
          ],
          correctAnswer: 0,
          explanation:
            "VACUUM removes old data files that are no longer referenced by the Delta table, helping to reduce storage costs while preserving time travel capabilities.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/delta/vacuum.html",
        },
        {
          question: "What are the ACID properties in Delta Lake? (Select all that apply)",
          options: ["Atomicity", "Consistency", "Isolation", "Durability"],
          correctAnswer: [0, 1, 2, 3],
          explanation:
            "ACID stands for Atomicity (all or nothing), Consistency (valid state), Isolation (concurrent operations), and Durability (permanent storage).",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/delta/",
          questionType: "multiple",
        },
        {
          question: "How does Delta Lake handle concurrent writes?",
          options: [
            "It prevents all concurrent operations",
            "It uses optimistic concurrency control",
            "It allows unlimited concurrent writes",
            "It requires manual locking",
          ],
          correctAnswer: 1,
          explanation:
            "Delta Lake uses optimistic concurrency control, allowing multiple writers to work simultaneously while detecting and resolving conflicts automatically.",
          topic: topic,
          difficulty: "Hard",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/delta/concurrency-control.html",
        },
      ],
      "Data Pipelines": [
        {
          question: "What is the recommended pattern for building robust data pipelines in Databricks?",
          options: [
            "Bronze-Silver-Gold medallion architecture",
            "Single large transformation",
            "Direct load to final tables",
            "Manual data validation only",
          ],
          correctAnswer: 0,
          explanation:
            "The medallion architecture (Bronze-Silver-Gold) provides a structured approach to data processing with increasing levels of quality and refinement.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/lakehouse/medallion.html",
        },
        {
          question: "What characterizes each layer of the medallion architecture? (Select all that apply)",
          options: [
            "Bronze: Raw data ingestion",
            "Silver: Cleaned and conformed data",
            "Gold: Business-level aggregates",
            "Platinum: Archived data",
          ],
          correctAnswer: [0, 1, 2],
          explanation:
            "Bronze layer contains raw data, Silver layer has cleaned and validated data, Gold layer contains business-ready aggregates. Platinum is not a standard medallion layer.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/lakehouse/medallion.html",
          questionType: "multiple",
        },
        {
          question: "What is Delta Live Tables (DLT)?",
          options: [
            "A storage format",
            "A declarative framework for building data pipelines",
            "A visualization tool",
            "A machine learning library",
          ],
          correctAnswer: 1,
          explanation:
            "Delta Live Tables is a declarative framework for building reliable, maintainable, and testable data processing pipelines.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/workflows/delta-live-tables/",
        },
        {
          question: "Which data processing patterns are supported by Databricks? (Select all that apply)",
          options: ["Batch processing", "Stream processing", "Micro-batch processing", "Real-time processing"],
          correctAnswer: [0, 1, 2, 3],
          explanation:
            "Databricks supports all these processing patterns through Apache Spark's unified engine, enabling both batch and streaming workloads.",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/structured-streaming/",
          questionType: "multiple",
        },
        {
          question: "What is the benefit of using structured streaming in Databricks?",
          options: [
            "It only works with small datasets",
            "It provides exactly-once processing guarantees",
            "It requires manual checkpointing",
            "It only supports batch processing",
          ],
          correctAnswer: 1,
          explanation:
            "Structured Streaming provides exactly-once processing guarantees and fault tolerance through automatic checkpointing and state management.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/structured-streaming/",
        },
      ],
      "Performance Optimization": [
        {
          question: "Which techniques can improve query performance in Databricks? (Select all that apply)",
          options: ["Data partitioning", "Z-ordering", "Caching", "Using SELECT *"],
          correctAnswer: [0, 1, 2],
          explanation:
            "Data partitioning, Z-ordering, and caching all improve query performance. Using SELECT * should be avoided as it reads unnecessary data.",
          topic: topic,
          difficulty: "Hard",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/optimizations/",
          questionType: "multiple",
        },
        {
          question: "What is Z-ordering in Delta Lake?",
          options: [
            "Sorting data alphabetically",
            "A technique to colocate related information in the same set of files",
            "Compressing data files",
            "Encrypting sensitive data",
          ],
          correctAnswer: 1,
          explanation:
            "Z-ordering is a technique that colocates related information in the same set of files, improving query performance by reducing the amount of data read.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/delta/optimizations/file-mgmt.html",
        },
        {
          question: "When should you use Delta Lake's OPTIMIZE command?",
          options: [
            "Never, it's automatic",
            "When you have many small files that impact query performance",
            "Only for large tables",
            "Before every query",
          ],
          correctAnswer: 1,
          explanation:
            "OPTIMIZE should be used when you have many small files that can impact query performance. It compacts small files into larger ones.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/delta/optimizations/file-mgmt.html",
        },
        {
          question: "What factors affect Spark job performance? (Select all that apply)",
          options: ["Cluster size", "Data partitioning", "Serialization", "Network bandwidth"],
          correctAnswer: [0, 1, 2, 3],
          explanation:
            "All these factors affect Spark performance: cluster size (resources), data partitioning (parallelism), serialization (data transfer), and network bandwidth (communication).",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/optimizations/",
          questionType: "multiple",
        },
        {
          question: "What is the purpose of broadcast joins in Spark?",
          options: [
            "To join very large tables",
            "To optimize joins when one table is small enough to fit in memory",
            "To create backup copies of data",
            "To partition data across nodes",
          ],
          correctAnswer: 1,
          explanation:
            "Broadcast joins optimize performance by broadcasting a small table to all nodes, avoiding expensive shuffle operations for joins.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/optimizations/",
        },
      ],
    },
    "databricks-certified-machine-learning-associate": {
      MLflow: [
        {
          question: "What is the purpose of MLflow Model Registry?",
          options: [
            "To store training data",
            "To manage model versions and lifecycle stages",
            "To run model training jobs",
            "To create model visualizations",
          ],
          correctAnswer: 1,
          explanation:
            "MLflow Model Registry provides centralized model store, versioning, stage transitions, and annotations.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/mlflow/model-registry.html",
        },
        {
          question: "Which MLflow components help with model lifecycle management? (Select all that apply)",
          options: ["MLflow Tracking", "MLflow Projects", "MLflow Models", "MLflow Registry"],
          correctAnswer: [0, 1, 2, 3],
          explanation:
            "All four components work together: Tracking for experiments, Projects for reproducible runs, Models for packaging, and Registry for model versioning.",
          topic: topic,
          difficulty: "Hard",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/mlflow/",
          questionType: "multiple",
        },
        {
          question: "What information does MLflow Tracking capture? (Select all that apply)",
          options: ["Parameters", "Metrics", "Artifacts", "Source code"],
          correctAnswer: [0, 1, 2, 3],
          explanation:
            "MLflow Tracking captures parameters, metrics, artifacts (files), and source code versions to ensure experiment reproducibility.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/mlflow/tracking.html",
          questionType: "multiple",
        },
        {
          question: "What is an MLflow experiment?",
          options: [
            "A single model training run",
            "A collection of runs for a particular task",
            "A deployment environment",
            "A data preprocessing step",
          ],
          correctAnswer: 1,
          explanation:
            "An MLflow experiment is a collection of runs, typically organized around a particular machine learning task or project.",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/mlflow/tracking.html",
        },
        {
          question: "How do you log metrics in MLflow?",
          options: ["mlflow.log_metric()", "mlflow.save_metric()", "mlflow.record_metric()", "mlflow.store_metric()"],
          correctAnswer: 0,
          explanation: "The mlflow.log_metric() function is used to log metrics during model training and evaluation.",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/mlflow/tracking.html",
        },
      ],
      "Model Training": [
        {
          question: "What is the benefit of using MLflow Tracking during model training?",
          options: [
            "Automatically improves model accuracy",
            "Records experiments, parameters, and metrics",
            "Reduces training time",
            "Eliminates the need for validation data",
          ],
          correctAnswer: 1,
          explanation:
            "MLflow Tracking records and organizes experiments, including parameters, metrics, artifacts, and code versions for reproducibility.",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/mlflow/tracking.html",
        },
        {
          question: "Which machine learning libraries are supported by MLflow? (Select all that apply)",
          options: ["Scikit-learn", "TensorFlow", "PyTorch", "XGBoost"],
          correctAnswer: [0, 1, 2, 3],
          explanation:
            "MLflow supports all major ML libraries including Scikit-learn, TensorFlow, PyTorch, XGBoost, and many others through its flexible tracking API.",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/mlflow/",
          questionType: "multiple",
        },
        {
          question: "What is hyperparameter tuning?",
          options: [
            "Adjusting model architecture",
            "Optimizing model configuration parameters to improve performance",
            "Cleaning training data",
            "Selecting features for the model",
          ],
          correctAnswer: 1,
          explanation:
            "Hyperparameter tuning involves optimizing model configuration parameters (like learning rate, regularization) to achieve better model performance.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/machine-learning/automl-hyperparam-tuning/",
        },
        {
          question: "Which techniques can be used for hyperparameter tuning? (Select all that apply)",
          options: ["Grid search", "Random search", "Bayesian optimization", "Manual tuning"],
          correctAnswer: [0, 1, 2, 3],
          explanation:
            "All these are valid hyperparameter tuning techniques: Grid search (exhaustive), Random search (sampling), Bayesian optimization (intelligent), and Manual tuning.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/machine-learning/automl-hyperparam-tuning/",
          questionType: "multiple",
        },
        {
          question: "What is cross-validation used for?",
          options: [
            "To increase training data size",
            "To assess model performance and reduce overfitting",
            "To speed up training",
            "To clean data automatically",
          ],
          correctAnswer: 1,
          explanation:
            "Cross-validation is used to assess model performance more reliably and detect overfitting by training and validating on different data subsets.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/machine-learning/train-model/",
        },
      ],
      "Feature Engineering": [
        {
          question: "Which Databricks feature helps with feature engineering and management?",
          options: ["Delta Lake only", "Feature Store", "MLflow Tracking", "Databricks SQL"],
          correctAnswer: 1,
          explanation:
            "Databricks Feature Store provides a centralized repository for features with lineage, discovery, and serving capabilities.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/machine-learning/feature-store/",
        },
        {
          question: "What are the benefits of using a Feature Store? (Select all that apply)",
          options: [
            "Feature reusability",
            "Consistency across teams",
            "Feature lineage tracking",
            "Automatic model training",
          ],
          correctAnswer: [0, 1, 2],
          explanation:
            "Feature Store provides reusability, consistency, and lineage tracking. It doesn't automatically train models but helps with feature management.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/machine-learning/feature-store/",
          questionType: "multiple",
        },
        {
          question: "What is feature engineering?",
          options: [
            "Building machine learning models",
            "The process of selecting and transforming variables for machine learning",
            "Deploying models to production",
            "Monitoring model performance",
          ],
          correctAnswer: 1,
          explanation:
            "Feature engineering is the process of selecting, modifying, or creating variables (features) from raw data to improve machine learning model performance.",
          topic: topic,
          difficulty: "Easy",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/machine-learning/feature-engineering/",
        },
        {
          question: "Which are common feature engineering techniques? (Select all that apply)",
          options: [
            "Scaling/Normalization",
            "Encoding categorical variables",
            "Creating interaction features",
            "Data visualization",
          ],
          correctAnswer: [0, 1, 2],
          explanation:
            "Scaling, encoding categorical variables, and creating interaction features are common feature engineering techniques. Data visualization is for analysis, not feature engineering.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/machine-learning/feature-engineering/",
          questionType: "multiple",
        },
        {
          question: "What is the purpose of feature scaling?",
          options: [
            "To increase the number of features",
            "To ensure features have similar ranges and scales",
            "To remove features from the dataset",
            "To create new features automatically",
          ],
          correctAnswer: 1,
          explanation:
            "Feature scaling ensures that features have similar ranges and scales, which is important for many machine learning algorithms that are sensitive to feature magnitudes.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/machine-learning/feature-engineering/",
        },
      ],
      "Model Deployment": [
        {
          question: "Which deployment options are available for MLflow models? (Select all that apply)",
          options: ["REST API endpoints", "Batch inference", "Real-time serving", "Email notifications"],
          correctAnswer: [0, 1, 2],
          explanation:
            "MLflow models can be deployed as REST APIs, used for batch inference, and served in real-time. Email notifications are not a deployment option.",
          topic: topic,
          difficulty: "Hard",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/machine-learning/model-serving/",
          questionType: "multiple",
        },
        {
          question: "What is model serving in Databricks?",
          options: [
            "Storing models in a repository",
            "Hosting models as REST API endpoints for real-time inference",
            "Training models automatically",
            "Visualizing model performance",
          ],
          correctAnswer: 1,
          explanation:
            "Model serving in Databricks hosts trained models as REST API endpoints, enabling real-time inference and predictions.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/machine-learning/model-serving/",
        },
        {
          question: "What are the stages in MLflow Model Registry? (Select all that apply)",
          options: ["None", "Staging", "Production", "Archived"],
          correctAnswer: [0, 1, 2, 3],
          explanation:
            "MLflow Model Registry has four stages: None (initial), Staging (testing), Production (live), and Archived (retired models).",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/mlflow/model-registry.html",
          questionType: "multiple",
        },
        {
          question: "What is A/B testing in model deployment?",
          options: [
            "Testing two different datasets",
            "Comparing performance of two model versions with live traffic",
            "Testing model accuracy twice",
            "Using two different algorithms",
          ],
          correctAnswer: 1,
          explanation:
            "A/B testing in model deployment involves comparing the performance of two model versions by routing live traffic to both and measuring their effectiveness.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/machine-learning/model-serving/",
        },
        {
          question: "What is model monitoring?",
          options: [
            "Training models continuously",
            "Tracking model performance and data drift in production",
            "Storing model artifacts",
            "Creating model documentation",
          ],
          correctAnswer: 1,
          explanation:
            "Model monitoring involves tracking model performance, data drift, and other metrics in production to ensure models continue to perform well over time.",
          topic: topic,
          difficulty: "Medium",
          certification: certification,
          sourceUrl: "https://docs.databricks.com/machine-learning/model-serving/",
        },
      ],
    },
  }

  const certQuestions = questionBank[certification as keyof typeof questionBank] || {}
  const topicQuestions = certQuestions[topic as keyof typeof certQuestions] || []

  // Return the requested number of questions, cycling through available ones if needed
  const selectedQuestions = []
  for (let i = 0; i < count; i++) {
    const questionIndex = i % Math.max(topicQuestions.length, 1)
    const baseQuestion = topicQuestions[questionIndex] || {
      question: `Sample question about ${topic} for ${certification}`,
      options: ["Option A", "Option B - Correct", "Option C", "Option D"],
      correctAnswer: 1,
      explanation: `This is a sample explanation for ${topic} in ${certification} certification.`,
      topic: topic,
      difficulty: "Medium",
      certification: certification,
      sourceUrl: "",
    }

    selectedQuestions.push({
      ...baseQuestion,
      id: `mock-${Date.now()}-${i}`,
    })
  }

  return selectedQuestions
}
