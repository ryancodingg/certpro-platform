export async function POST(request: Request) {
  try {
    const { question, options, correctAnswer, explanation, userQuestion } = await request.json()

    // Always use fallback responses to avoid quota issues
    // In a production environment, you could add API key validation here
    const fallbackResponse = getFallbackResponse(userQuestion, question, options, correctAnswer, explanation)
    return Response.json({ response: fallbackResponse })

    /* 
    // Commented out AI SDK code to prevent quota errors
    // Uncomment and configure when you have a working OpenAI API key
    
    if (!process.env.OPENAI_API_KEY) {
      const fallbackResponse = getFallbackResponse(userQuestion, question, options, correctAnswer, explanation)
      return Response.json({ response: fallbackResponse })
    }

    const { generateText } = await import("ai")
    const { openai } = await import("@ai-sdk/openai")

    const prompt = `
You are an expert instructor for Microsoft Azure Data Fundamentals (DP-700) certification.

Question: ${question}
Options: ${options.map((opt: string, idx: number) => `${String.fromCharCode(65 + idx)}) ${opt}`).join("\n")}
Correct Answer: ${String.fromCharCode(65 + correctAnswer)}) ${options[correctAnswer]}
Official Explanation: ${explanation}

User's Question: ${userQuestion}

Please provide a clear, educational response to the user's question. Focus on helping them understand the concept better. Keep your response concise but informative.
`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      system:
        "You are a helpful Azure certification instructor. Provide clear, accurate explanations that help students understand Azure data concepts.",
    })

    return Response.json({ response: text })
    */
  } catch (error: any) {
    console.error("Error in AI explain:", error)

    // Always fallback to mock response if anything goes wrong
    const { userQuestion, question, options, correctAnswer, explanation } = await request.json()
    const fallbackResponse = getFallbackResponse(userQuestion, question, options, correctAnswer, explanation)

    return Response.json({ response: fallbackResponse })
  }
}

function getFallbackResponse(
  userQuestion: string,
  question: string,
  options: string[],
  correctAnswer: number,
  explanation: string,
): string {
  const correctOption = options[correctAnswer]

  if (
    userQuestion.toLowerCase().includes("why is this correct") ||
    userQuestion.toLowerCase().includes("why correct")
  ) {
    return `✅ **Why "${correctOption}" is correct:**

${explanation}

**Key Learning Points for DP-700:**
• Understanding the primary purpose of each Azure service is crucial
• Focus on the core capabilities that distinguish each service
• Remember that Azure services are designed for specific use cases

💡 **Study Tip**: Create a mental map of Azure services and their main functions. This question tests your ability to identify the primary purpose of the service mentioned.

📚 **For deeper understanding**: Review the official Microsoft Learn documentation for comprehensive details about this service's capabilities and use cases.`
  }

  if (userQuestion.toLowerCase().includes("why are the other") || userQuestion.toLowerCase().includes("others wrong")) {
    const incorrectOptions = options.filter((_, index) => index !== correctAnswer)
    return `❌ **Why the other options are incorrect:**

${incorrectOptions
  .map((option, index) => {
    const originalIndex = options.findIndex((opt) => opt === option)
    return `**${String.fromCharCode(65 + originalIndex)}) ${option}**
   This option describes a different type of service or capability that doesn't match the primary function being asked about in the question.`
  })
  .join("\n\n")}

✅ **The correct answer** focuses on the specific, primary capability that defines this service in the Azure ecosystem.

🎯 **Exam Strategy**: When facing similar questions on DP-700, eliminate options that describe:
• Secondary features rather than primary purposes
• Functions of completely different service categories
• Capabilities that require additional services or configurations

📖 **Study Approach**: For each Azure service, memorize its ONE main purpose first, then learn additional features.`
  }

  // Handle custom questions with more specific responses
  if (userQuestion.toLowerCase().includes("example") || userQuestion.toLowerCase().includes("use case")) {
    return `🔍 **Real-world examples for "${correctOption}":**

${explanation}

**Practical Scenarios:**
• **Enterprise Data Integration**: Companies use this service when they need to move data between different systems and transform it for analysis
• **Cloud Migration Projects**: Organizations leverage this capability when moving from on-premises to cloud-based data solutions  
• **Modern Data Architecture**: This service is a key component in building scalable, cloud-native data platforms

**Industry Applications:**
• Retail: Processing sales data from multiple stores and channels
• Healthcare: Integrating patient data from various systems
• Finance: Consolidating transaction data for reporting and compliance

🎓 **For DP-700 Success**: Focus on understanding WHEN and WHY you'd choose each service, not just WHAT it does.

💼 **Career Relevance**: These concepts are fundamental to modern data engineering and analytics roles.`
  }

  if (userQuestion.toLowerCase().includes("difference") || userQuestion.toLowerCase().includes("compare")) {
    return `⚖️ **Key Differences to Understand:**

**${correctOption}**: ${explanation}

**How it differs from other options:**
• Each Azure service has a specific primary purpose in the data ecosystem
• While some services may have overlapping features, their core design goals are different
• Understanding these distinctions is essential for choosing the right tool for each scenario

**Comparison Framework for DP-700:**
1. **Primary Purpose**: What is the main problem each service solves?
2. **Data Types**: What kind of data does each service work best with?
3. **Use Cases**: When would you choose one service over another?
4. **Integration**: How does each service fit into a broader data architecture?

🎯 **Exam Tip**: DP-700 questions often test your ability to choose the RIGHT service for a specific scenario, not just your knowledge of what each service can do.

📝 **Study Method**: Create a comparison chart with services as columns and key characteristics as rows.`
  }

  if (userQuestion.toLowerCase().includes("more detail") || userQuestion.toLowerCase().includes("explain more")) {
    return `📖 **Detailed Explanation:**

${explanation}

**Breaking it down further:**
• This service addresses a specific need in modern data architectures
• It's designed to handle the complexities of working with data at scale
• The key benefit is reducing the operational overhead of data management tasks

**Technical Context:**
• Built on Microsoft's cloud infrastructure for reliability and scalability
• Integrates seamlessly with other Azure services
• Follows industry best practices for security and compliance

**Learning Path for DP-700:**
1. Understand the fundamental data concepts
2. Learn how each Azure service fits into the data lifecycle
3. Practice identifying the right service for different scenarios
4. Study real-world implementation patterns

🔗 **Next Steps**: Review the official Microsoft Learn modules for hands-on experience with this service.

💡 **Remember**: The DP-700 exam focuses on foundational concepts, so understanding the "why" behind each service is more important than memorizing technical specifications.`
  }

  // Generic fallback for custom questions
  return `🤖 **AI Assistant Response:**

Based on your question about this topic, here's additional context:

${explanation}

**Key Concepts for DP-700:**
• **Service Purpose**: Each Azure data service is designed for specific scenarios and data types
• **Decision Factors**: Choose services based on your data requirements, scale needs, and integration requirements
• **Best Practices**: Understanding when and why to use each service is more valuable than memorizing features

**Study Recommendations:**
1. **Hands-on Practice**: Try the service in the Azure portal (many have free tiers)
2. **Official Documentation**: Review Microsoft Learn modules for comprehensive coverage
3. **Scenario-based Learning**: Focus on use cases rather than just technical specifications
4. **Practice Questions**: Take more practice tests to reinforce your understanding

💡 **Pro Tip**: The DP-700 certification focuses on fundamental concepts, so understanding the core purpose and use cases of each service is key to success.

📚 **Additional Resources**: Microsoft Learn provides free, comprehensive training materials specifically designed for DP-700 preparation.

*This response is generated from our comprehensive knowledge base to help you succeed in your DP-700 certification journey.*`
}
