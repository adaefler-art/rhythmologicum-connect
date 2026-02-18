import UIKit
import Capacitor
import SwiftUI
import Foundation

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        if NativeChatConfig.isEnabled {
            let chatView = NativeChatView(
                viewModel: NativeChatViewModel(
                    apiClient: NativeChatAPIClient(config: NativeChatConfig.current)
                )
            )

            let hostingController = UIHostingController(rootView: chatView)
            hostingController.title = "PAT"
            let navigationController = UINavigationController(rootViewController: hostingController)

            let appWindow = UIWindow(frame: UIScreen.main.bounds)
            appWindow.rootViewController = navigationController
            appWindow.makeKeyAndVisible()
            window = appWindow
        }

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
    let authToken: String

    static var isEnabled: Bool {
        guard let value = Bundle.main.object(forInfoDictionaryKey: "NATIVE_CHAT_ENABLED") else {
            return false
        }

        if let boolValue = value as? Bool {
            return boolValue
        }

        if let stringValue = value as? String {
            return NSString(string: stringValue).boolValue
        }

        return false
    }

    static var current: NativeChatConfig {
        let baseURLString = (Bundle.main.object(forInfoDictionaryKey: "NATIVE_CHAT_BASE_URL") as? String) ?? "https://example.invalid"
        let authToken = (Bundle.main.object(forInfoDictionaryKey: "NATIVE_CHAT_AUTH_TOKEN") as? String) ?? ""

        let url = URL(string: baseURLString) ?? URL(string: "https://example.invalid")!
        return NativeChatConfig(baseURL: url, authToken: authToken)
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

private struct ChatSession: Codable {
    let id: String
}

private struct ChatMessageRequest: Codable {
    let text: String
}

private struct ChatMessageResponse: Codable {
    let message: ChatMessage
}

private struct ChatMessagesResponse: Codable {
    let messages: [ChatMessage]
}

private final class NativeChatAPIClient {
    private let config: NativeChatConfig
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    init(config: NativeChatConfig) {
        self.config = config
        self.decoder = JSONDecoder()
        self.encoder = JSONEncoder()
        self.decoder.dateDecodingStrategy = .iso8601
        self.encoder.dateEncodingStrategy = .iso8601
    }

    func createSession(completion: @escaping (Result<ChatSession, Error>) -> Void) {
        var request = URLRequest(url: config.baseURL.appendingPathComponent("/api/mobile/chat/sessions"))
        request.httpMethod = "POST"
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
                let session = try self.decoder.decode(ChatSession.self, from: data)
                completion(.success(session))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }

    func loadMessages(sessionId: String, completion: @escaping (Result<[ChatMessage], Error>) -> Void) {
        var request = URLRequest(url: config.baseURL.appendingPathComponent("/api/mobile/chat/sessions/\(sessionId)/messages"))
        request.httpMethod = "GET"
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
                let response = try self.decoder.decode(ChatMessagesResponse.self, from: data)
                completion(.success(response.messages))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }

    func sendMessage(sessionId: String, text: String, completion: @escaping (Result<ChatMessage, Error>) -> Void) {
        var request = URLRequest(url: config.baseURL.appendingPathComponent("/api/mobile/chat/sessions/\(sessionId)/messages"))
        request.httpMethod = "POST"
        applyCommonHeaders(to: &request)

        do {
            request.httpBody = try encoder.encode(ChatMessageRequest(text: text))
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
                let response = try self.decoder.decode(ChatMessageResponse.self, from: data)
                completion(.success(response.message))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }

    func completeSession(sessionId: String, completion: @escaping (Result<Void, Error>) -> Void) {
        var request = URLRequest(url: config.baseURL.appendingPathComponent("/api/mobile/chat/sessions/\(sessionId)/complete"))
        request.httpMethod = "POST"
        applyCommonHeaders(to: &request)

        URLSession.shared.dataTask(with: request) { _, _, error in
            if let error = error {
                completion(.failure(error))
                return
            }

            completion(.success(()))
        }.resume()
    }

    private func applyCommonHeaders(to request: inout URLRequest) {
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if !config.authToken.isEmpty {
            request.setValue("Bearer \(config.authToken)", forHTTPHeaderField: "Authorization")
        }
    }
}

private enum NativeChatError: LocalizedError {
    case emptyResponse
    case sessionNotReady

    var errorDescription: String? {
        switch self {
        case .emptyResponse:
            return "Leere API-Antwort erhalten."
        case .sessionNotReady:
            return "Chat-Session ist noch nicht bereit."
        }
    }
}

private final class NativeChatViewModel: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var inputText: String = ""
    @Published var isLoading: Bool = false
    @Published var errorText: String?

    private let apiClient: NativeChatAPIClient
    private var sessionId: String?

    init(apiClient: NativeChatAPIClient) {
        self.apiClient = apiClient
    }

    func bootstrapIfNeeded() {
        guard sessionId == nil, !isLoading else { return }
        isLoading = true
        errorText = nil

        apiClient.createSession { [weak self] result in
            guard let self = self else { return }
            DispatchQueue.main.async {
                switch result {
                case .success(let session):
                    self.sessionId = session.id
                    self.loadMessages()
                case .failure(let error):
                    self.isLoading = false
                    self.errorText = error.localizedDescription
                }
            }
        }
    }

    func loadMessages() {
        guard let sessionId = sessionId else {
            errorText = NativeChatError.sessionNotReady.localizedDescription
            return
        }

        apiClient.loadMessages(sessionId: sessionId) { [weak self] result in
            guard let self = self else { return }
            DispatchQueue.main.async {
                self.isLoading = false
                switch result {
                case .success(let loaded):
                    self.messages = loaded.sorted(by: { $0.createdAt < $1.createdAt })
                case .failure(let error):
                    self.errorText = error.localizedDescription
                }
            }
        }
    }

    func sendMessage() {
        let trimmed = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        guard let sessionId = sessionId else {
            errorText = NativeChatError.sessionNotReady.localizedDescription
            return
        }

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

        apiClient.sendMessage(sessionId: sessionId, text: trimmed) { [weak self] result in
            guard let self = self else { return }
            DispatchQueue.main.async {
                self.isLoading = false
                switch result {
                case .success(let assistantMessage):
                    self.messages.append(assistantMessage)
                case .failure(let error):
                    self.errorText = error.localizedDescription
                }
            }
        }
    }

    func completeConversation() {
        guard let sessionId = sessionId else {
            errorText = NativeChatError.sessionNotReady.localizedDescription
            return
        }

        isLoading = true
        apiClient.completeSession(sessionId: sessionId) { [weak self] result in
            guard let self = self else { return }
            DispatchQueue.main.async {
                self.isLoading = false
                if case .failure(let error) = result {
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
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 12) {
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
                TextField("Ihre Nachricht an PAT...", text: $viewModel.inputText)
                    .textFieldStyle(RoundedBorderTextFieldStyle())

                Button("Senden") {
                    viewModel.sendMessage()
                }
                .disabled(viewModel.isLoading)
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)

            Button("Erfassung abschliessen") {
                viewModel.completeConversation()
            }
            .disabled(viewModel.isLoading)
            .padding(.top, 8)
            .padding(.bottom, 16)
        }
        .navigationBarTitle("PAT", displayMode: .inline)
        .overlay(
            Group {
                if viewModel.isLoading {
                    ProgressView()
                }
            }
        )
        .onAppear {
            viewModel.bootstrapIfNeeded()
        }
    }

    @ViewBuilder
    private func messageBubble(_ text: String, isAssistant: Bool) -> some View {
        Text(text)
            .font(.body)
            .foregroundColor(.primary)
            .padding(12)
            .background(isAssistant ? Color(UIColor.systemGray6) : Color(UIColor.systemBlue).opacity(0.15))
            .cornerRadius(14)
    }
}
