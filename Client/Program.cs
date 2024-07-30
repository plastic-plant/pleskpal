using Newtonsoft.Json;
using PhotinoNET;
using System.Drawing;
using System.Text;
using System.Text.Json;

namespace Client
{
	internal class Program
	{
		static readonly string ServerBaseUri = "http://localhost:80/";

		[STAThread]
		static void Main(string[] args)
		{
			var window = new PhotinoWindow()
				.SetTitle("Client")
				.SetUseOsDefaultSize(false)
				.SetSize(new Size(1200, 840))
				.Center()
				.RegisterWebMessageReceivedHandler(async (object? sender, string message) =>
				{
					var messageObject = JsonConvert.DeserializeObject<Message>(message);
					var window = (PhotinoWindow)sender!;
					switch (messageObject?.command)
					{
						case "ask":
							string response = await GetConversationResponse(messageObject.payload);							
							window.SendWebMessage(response);
							break;

						case "resize":
							var size = messageObject.payload.Split("x");
							window.SetSize(int.Parse(size[0]), int.Parse(size[1]));
							break;

					}
				})
				.Load(new Uri(ServerBaseUri + "content/conversation.html")); //.Load("wwwroot/index.html");

			window.WaitForClose();
		}

		static async Task<string> GetConversationResponse(string message)
		{
			var requestJson = $"{{\"request\":\"{message}\"}}";
			var requestContent = new StringContent(requestJson, Encoding.UTF8, "application/json");

			try
			{
				using var client = new HttpClient();
				var response = await client.PostAsync(ServerBaseUri + "conversation", requestContent);
				response.EnsureSuccessStatusCode();

				string responseJson = await response.Content.ReadAsStringAsync();
				return JsonDocument.Parse(responseJson).RootElement.GetProperty("response").GetString() ?? "";
			}
			catch (HttpRequestException e)
			{
				return $"Error: {e.Message}";
			}
		}
	}

	public class Message
	{
		public string command { get; set; }
		public string payload { get; set; }
	}
}
