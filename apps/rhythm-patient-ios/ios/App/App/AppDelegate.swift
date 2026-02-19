import UIKit
import Capacitor
import SwiftUI
import Foundation

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        let storyboard = UIStoryboard(name: "Main", bundle: nil)
        let webRootViewController = storyboard.instantiateInitialViewController() ?? UIViewController()
        webRootViewController.title = "Start"
        webRootViewController.tabBarItem = UITabBarItem(title: "Start", image: UIImage(systemName: "house"), tag: 0)

        let chatViewModel = NativeChatViewModel(
            apiClient: NativeChatAPIClient(config: NativeChatConfig.current)
        )
        let nativeChatView = NativeChatView(viewModel: chatViewModel)
        let chatHostingController = UIHostingController(rootView: nativeChatView)
        chatHostingController.title = "PAT Chat"
        chatHostingController.tabBarItem = UITabBarItem(title: "Chat", image: UIImage(systemName: "message"), tag: 1)

        let startNavigationController = UINavigationController(rootViewController: webRootViewController)
        let chatNavigationController = UINavigationController(rootViewController: chatHostingController)

        let tabBarController = UITabBarController()
        tabBarController.viewControllers = [startNavigationController, chatNavigationController]
        tabBarController.selectedIndex = 0

        let appWindow = UIWindow(frame: UIScreen.main.bounds)
        appWindow.rootViewController = tabBarController
        appWindow.makeKeyAndVisible()
        window = appWindow

        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}

private struct NativeChatConfig {
    let baseURL: URL

    static var current: NativeChatConfig {
        let baseURLString = (Bundle.main.object(forInfoDictionaryKey: "NATIVE_CHAT_BASE_URL") as? String) ?? "https://rhythm-patient.vercel.app"
        let url = URL(string: baseURLString) ?? URL(string: "https://rhythm-patient.vercel.app")!
        return NativeChatConfig(baseURL: url)
    }
}

private enum ChatRole: String, Codable {
    case user
    case assistant
    case system
}

private struct ChatMessage: Identifiable, Codable {
    let id: String
    let role: ChatRole
    let text: String
    let createdAt: Date
}

private struct PersistedChatMessage: Codable {
    let id: String
    let role: ChatRole
    let content: String
    let created_at: String
}

private struct ChatHistoryData: Codable {
    let messages: [PersistedChatMessage]
}

private struct SendChatData: Codable {
    let reply: String
    let messageId: String
}

private struct ChatApiError: Codable {
    let code: String
    let message: String
}

private struct ChatApiResponse<T: Codable>: Codable {
    let success: Bool
    let data: T?
    let error: ChatApiError?
}

private struct SendChatRequest: Codable {
    let message: String
}

private final class NativeChatAPIClient {
    private let config: NativeChatConfig
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder
    private let iso8601Parser = ISO8601DateFormatter()

    init(config: NativeChatConfig) {
        self.config = config
        self.decoder = JSONDecoder()
        self.encoder = JSONEncoder()
        self.decoder.dateDecodingStrategy = .iso8601
        self.encoder.dateEncodingStrategy = .iso8601
    }

    func loadMessages(completion: @escaping (Result<[ChatMessage], Error>) -> Void) {
        var request = URLRequest(url: config.baseURL.appendingPathComponent("/api/amy/chat"))
        request.httpMethod = "GET"
        request.httpShouldHandleCookies = true
        applyCommonHeaders(to: &request)

        URLSession.shared.dataTask(with: request) { data, _, error in
            if let error = error {
                completion(.failure(error))
                return
            }

            guard let data = data else {
                completion(.failure(NativeChatError.emptyResponse))
                return
            }

            do {
                let response = try self.decoder.decode(ChatApiResponse<ChatHistoryData>.self, from: data)
                guard response.success, let payload = response.data else {
                    completion(.failure(NativeChatError.apiFailure(response.error?.message ?? "History loading failed")))
                    return
                }

                let mapped = payload.messages.compactMap(self.mapPersistedMessage)
                completion(.success(mapped.sorted(by: { $0.createdAt < $1.createdAt })))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }

    func sendMessage(text: String, completion: @escaping (Result<ChatMessage, Error>) -> Void) {
        var request = URLRequest(url: config.baseURL.appendingPathComponent("/api/amy/chat"))
        request.httpMethod = "POST"
        request.httpShouldHandleCookies = true
        applyCommonHeaders(to: &request)

        do {
            request.httpBody = try encoder.encode(SendChatRequest(message: text))
        } catch {
            completion(.failure(error))
            return
        }

        URLSession.shared.dataTask(with: request) { data, _, error in
            if let error = error {
                completion(.failure(error))
                return
            }

            guard let data = data else {
                completion(.failure(NativeChatError.emptyResponse))
                return
            }

            do {
                let response = try self.decoder.decode(ChatApiResponse<SendChatData>.self, from: data)
                guard response.success, let payload = response.data else {
                    completion(.failure(NativeChatError.apiFailure(response.error?.message ?? "Sending message failed")))
                    return
                }

                let assistantMessage = ChatMessage(
                    id: payload.messageId,
                    role: .assistant,
                    text: payload.reply,
                    createdAt: Date()
                )
                completion(.success(assistantMessage))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }

    private func applyCommonHeaders(to request: inout URLRequest) {
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let cookies = HTTPCookieStorage.shared.cookies(for: config.baseURL), !cookies.isEmpty {
            let headers = HTTPCookie.requestHeaderFields(with: cookies)
            for (header, value) in headers {
                request.setValue(value, forHTTPHeaderField: header)
            }
        }
    }

    private func mapPersistedMessage(_ message: PersistedChatMessage) -> ChatMessage {
        let parsedDate = iso8601Parser.date(from: message.created_at) ?? Date()
        return ChatMessage(
            id: message.id,
            role: message.role,
            text: message.content,
            createdAt: parsedDate
        )
    }
}

private enum NativeChatError: LocalizedError {
    case emptyResponse
    case apiFailure(String)

    var errorDescription: String? {
        switch self {
        case .emptyResponse:
            return "Leere API-Antwort erhalten."
        case .apiFailure(let message):
            return message
        }
    }
}

private final class NativeChatViewModel: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var inputText: String = ""
    @Published var isLoading: Bool = false
    @Published var errorText: String?
    @Published var isBootstrapped: Bool = false

    private let apiClient: NativeChatAPIClient

    init(apiClient: NativeChatAPIClient) {
        self.apiClient = apiClient
    }

    func bootstrapIfNeeded() {
        guard !isBootstrapped, !isLoading else { return }
        isLoading = true
        errorText = nil

        apiClient.loadMessages { [weak self] result in
            guard let self = self else { return }
            DispatchQueue.main.async {
                self.isBootstrapped = true
                self.isLoading = false
                switch result {
                case .success(let loaded):
                    self.messages = loaded
                case .failure(let error):
                    self.errorText = error.localizedDescription
                }
            }
        }
    }

    func sendMessage() {
        let trimmed = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        inputText = ""
        isLoading = true
        errorText = nil

        let optimisticMessage = ChatMessage(
            id: UUID().uuidString,
            role: .user,
            text: trimmed,
            createdAt: Date()
        )
        messages.append(optimisticMessage)

        apiClient.sendMessage(text: trimmed) { [weak self] result in
            guard let self = self else { return }
            DispatchQueue.main.async {
                self.isLoading = false
                switch result {
                case .success(let assistantMessage):
                    self.messages.append(assistantMessage)
                case .failure(let error):
                    self.messages.removeAll(where: { $0.id == optimisticMessage.id })
                    self.errorText = error.localizedDescription
                }
            }
        }
    }
}

private struct NativeChatView: View {
    @ObservedObject var viewModel: NativeChatViewModel

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 8) {
                Circle()
                    .fill(Color.green)
                    .frame(width: 8, height: 8)
                Text("PAT Chat")
                    .font(.headline)
                    .foregroundColor(.white)
                Spacer()
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color.blue)

            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 12) {
                        if viewModel.isLoading && viewModel.messages.isEmpty {
                            HStack {
                                Spacer()
                                ProgressView()
                                    .padding(12)
                                    .background(Color(UIColor.systemBackground).opacity(0.9))
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                                Spacer()
                            }
                            .padding(.top, 8)
                        }

                        if viewModel.messages.isEmpty && !viewModel.isLoading {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("👋 Hallo! Ich bin PAT.")
                                    .font(.body)
                                    .foregroundColor(.secondary)
                                Text("Ich kann Fragen zu Stress, Schlaf und Resilienz beantworten.")
                                    .font(.footnote)
                                    .foregroundColor(.secondary)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.top, 8)
                        }

                        ForEach(viewModel.messages) { message in
                            HStack {
                                if message.role == .assistant {
                                    messageBubble(message.text, isAssistant: true)
                                    Spacer(minLength: 32)
                                } else {
                                    Spacer(minLength: 32)
                                    messageBubble(message.text, isAssistant: false)
                                }
                            }
                            .id(message.id)
                        }

                        if viewModel.isLoading && !viewModel.messages.isEmpty {
                            HStack {
                                HStack(spacing: 6) {
                                    Circle().fill(Color.gray.opacity(0.7)).frame(width: 6, height: 6)
                                    Circle().fill(Color.gray.opacity(0.7)).frame(width: 6, height: 6)
                                    Circle().fill(Color.gray.opacity(0.7)).frame(width: 6, height: 6)
                                }
                                .padding(10)
                                .background(Color(UIColor.systemGray6))
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                                Spacer(minLength: 32)
                            }
                            .id("typing-indicator")
                        }
                    }
                    .padding(16)
                }
                .onChange(of: viewModel.messages.count) { _ in
                    guard let last = viewModel.messages.last else { return }
                    withAnimation {
                        proxy.scrollTo(last.id, anchor: .bottom)
                    }
                }
            }

            if let errorText = viewModel.errorText {
                Text(errorText)
                    .font(.footnote)
                    .foregroundColor(.red)
                    .padding(.horizontal, 16)
                    .padding(.bottom, 8)
            }

            HStack(spacing: 8) {
                TextField("Nachricht schreiben...", text: $viewModel.inputText)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .background(Color(UIColor.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 10))

                Button {
                    viewModel.sendMessage()
                } label: {
                    Image(systemName: "paperplane.fill")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(width: 40, height: 40)
                        .background(
                            viewModel.inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || viewModel.isLoading
                                ? Color.gray
                                : Color.blue
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }
                .disabled(viewModel.inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || viewModel.isLoading)
            }
            .padding(.horizontal, 16)
            .padding(.top, 10)
            .padding(.bottom, 8)

            Text("Info-Chat • Keine Aktionen möglich")
                .font(.caption)
                .foregroundColor(.secondary)
                .padding(.bottom, 10)
        }
        .navigationBarTitle("Chat", displayMode: .inline)
        .onAppear {
            viewModel.bootstrapIfNeeded()
        }
    }

    @ViewBuilder
    private func messageBubble(_ text: String, isAssistant: Bool) -> some View {
        Text(text)
            .font(.system(size: 15))
            .foregroundColor(isAssistant ? .primary : .white)
            .padding(12)
            .background(isAssistant ? Color(UIColor.systemGray6) : Color.blue)
            .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
