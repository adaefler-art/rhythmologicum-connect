import UIKit
import Capacitor
import SwiftUI
import Foundation
import LocalAuthentication
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    private weak var startWebRootViewController: UIViewController?
    private weak var tabBarControllerRef: UITabBarController?
    private var sessionKeepAliveTimer: Timer?
    private var isUnlockInProgress = false
    private var lastBackgroundAt: Date?

    private let biometricPreferenceKey = "ios_shell_biometric_unlock_enabled"
    private let sessionKeepAliveInterval: TimeInterval = 240
    private let biometricUnlockGracePeriod: TimeInterval = 180
    private let shellBaseUrl = URL(string: "https://rhythm-patient.vercel.app")!

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Design token: public/design-tokens.json -> colors.primary.600 (#0284c7)
        let shellHeaderBlue = UIColor(red: 2.0 / 255.0, green: 132.0 / 255.0, blue: 199.0 / 255.0, alpha: 1.0)

        let navBarAppearance = UINavigationBarAppearance()
        navBarAppearance.configureWithOpaqueBackground()
        navBarAppearance.backgroundColor = shellHeaderBlue
        navBarAppearance.shadowColor = .clear
        navBarAppearance.titleTextAttributes = [.foregroundColor: UIColor.white]
        navBarAppearance.largeTitleTextAttributes = [.foregroundColor: UIColor.white]

        let storyboard = UIStoryboard(name: "Main", bundle: nil)
        let webRootViewController = storyboard.instantiateInitialViewController() ?? UIViewController()
        startWebRootViewController = webRootViewController
        webRootViewController.title = "Start"
        webRootViewController.tabBarItem = UITabBarItem(title: "Start", image: UIImage(systemName: "house"), tag: 0)

        let chatViewModel = NativeChatViewModel(
            apiClient: NativeChatAPIClient(config: NativeChatConfig.current)
        )
        let nativeChatView = NativeChatView(viewModel: chatViewModel)
        let chatHostingController = UIHostingController(rootView: nativeChatView)
        chatHostingController.title = "PAT Chat"
        chatHostingController.tabBarItem = UITabBarItem(title: "Chat", image: UIImage(systemName: "message"), tag: 1)

        let accountView = ShellAccountView(
            biometricEnabled: isBiometricUnlockEnabled(),
            onBiometricToggle: { [weak self] enabled in
                self?.setBiometricUnlockEnabled(enabled)
            },
            onReLogin: { [weak self] in
                self?.navigateToLogin(clearSession: false)
            },
            onResetSession: { [weak self] in
                self?.navigateToLogin(clearSession: true)
            }
        )
        let accountHostingController = UIHostingController(rootView: accountView)
        accountHostingController.title = "Konto"
        accountHostingController.tabBarItem = UITabBarItem(title: "Konto", image: UIImage(systemName: "person.crop.circle"), tag: 2)

        let startNavigationController = UINavigationController(rootViewController: webRootViewController)
        let chatNavigationController = UINavigationController(rootViewController: chatHostingController)
        let accountNavigationController = UINavigationController(rootViewController: accountHostingController)

        startNavigationController.navigationBar.standardAppearance = navBarAppearance
        startNavigationController.navigationBar.scrollEdgeAppearance = navBarAppearance
        startNavigationController.navigationBar.compactAppearance = navBarAppearance
        startNavigationController.navigationBar.tintColor = .white
        startNavigationController.navigationBar.isTranslucent = false

        chatNavigationController.navigationBar.standardAppearance = navBarAppearance
        chatNavigationController.navigationBar.scrollEdgeAppearance = navBarAppearance
        chatNavigationController.navigationBar.compactAppearance = navBarAppearance
        chatNavigationController.navigationBar.tintColor = .white
        chatNavigationController.navigationBar.isTranslucent = false

        accountNavigationController.navigationBar.standardAppearance = navBarAppearance
        accountNavigationController.navigationBar.scrollEdgeAppearance = navBarAppearance
        accountNavigationController.navigationBar.compactAppearance = navBarAppearance
        accountNavigationController.navigationBar.tintColor = .white
        accountNavigationController.navigationBar.isTranslucent = false

        let tabBarController = UITabBarController()
        tabBarController.viewControllers = [startNavigationController, chatNavigationController, accountNavigationController]
        tabBarController.selectedIndex = 0
        tabBarControllerRef = tabBarController

        let appWindow = UIWindow(frame: UIScreen.main.bounds)
        appWindow.rootViewController = tabBarController
        appWindow.makeKeyAndVisible()
        window = appWindow

        DispatchQueue.main.async { [weak self] in
            self?.startSessionKeepAlive()
        }

        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
        lastBackgroundAt = Date()
        stopSessionKeepAlive()
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
        startSessionKeepAlive()
        authenticateIfNeeded(force: false)
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

    private func isBiometricUnlockEnabled() -> Bool {
        if UserDefaults.standard.object(forKey: biometricPreferenceKey) == nil {
            UserDefaults.standard.set(true, forKey: biometricPreferenceKey)
            return true
        }

        return UserDefaults.standard.bool(forKey: biometricPreferenceKey)
    }

    private func setBiometricUnlockEnabled(_ enabled: Bool) {
        UserDefaults.standard.set(enabled, forKey: biometricPreferenceKey)
    }

    private func authenticateIfNeeded(force: Bool) {
        guard isBiometricUnlockEnabled(), !isUnlockInProgress else { return }
        guard force || shouldRequireBiometricUnlock() else { return }

        isUnlockInProgress = true

        let context = LAContext()
        context.localizedCancelTitle = "Später"

        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error) else {
            isUnlockInProgress = false
            return
        }

        context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: "Rhythmologicum Connect entsperren") { [weak self] success, _ in
            DispatchQueue.main.async {
                guard let self = self else { return }
                self.isUnlockInProgress = false
                if !success {
                    self.presentBiometricRetryPrompt()
                } else {
                    self.lastBackgroundAt = nil
                }
            }
        }
    }

    private func shouldRequireBiometricUnlock() -> Bool {
        guard let backgroundAt = lastBackgroundAt else { return false }
        let elapsed = Date().timeIntervalSince(backgroundAt)
        return elapsed >= biometricUnlockGracePeriod
    }

    private func presentBiometricRetryPrompt() {
        guard let root = window?.rootViewController else { return }

        let alert = UIAlertController(
            title: "Entsperrung erforderlich",
            message: "Bitte entsperren Sie die App mit Face ID oder Gerätecode.",
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "Erneut versuchen", style: .default, handler: { [weak self] _ in
            self?.authenticateIfNeeded(force: true)
        }))
        alert.addAction(UIAlertAction(title: "Abbrechen", style: .cancel))

        root.present(alert, animated: true)
    }

    private func startSessionKeepAlive() {
        stopSessionKeepAlive()

        sessionKeepAliveTimer = Timer.scheduledTimer(withTimeInterval: sessionKeepAliveInterval, repeats: true) { [weak self] _ in
            self?.pingSessionKeepAlive()
        }
    }

    private func stopSessionKeepAlive() {
        sessionKeepAliveTimer?.invalidate()
        sessionKeepAliveTimer = nil
    }

    private func pingSessionKeepAlive() {
        var request = URLRequest(url: shellBaseUrl.appendingPathComponent("/api/patient/state"))
        request.httpMethod = "GET"
        request.httpShouldHandleCookies = true

        if let cookies = HTTPCookieStorage.shared.cookies(for: shellBaseUrl), !cookies.isEmpty {
            let headers = HTTPCookie.requestHeaderFields(with: cookies)
            for (header, value) in headers {
                request.setValue(value, forHTTPHeaderField: header)
            }
        }

        URLSession.shared.dataTask(with: request).resume()
    }

    private func navigateToLogin(clearSession: Bool) {
        let goToLogin = { [weak self] in
            self?.tabBarControllerRef?.selectedIndex = 0
            self?.loadWebPath("/patient")
        }

        if clearSession {
            clearWebSessionData {
                DispatchQueue.main.async {
                    goToLogin()
                }
            }
            return
        }

        goToLogin()
    }

    private func clearWebSessionData(completion: @escaping () -> Void) {
        if let cookies = HTTPCookieStorage.shared.cookies {
            for cookie in cookies {
                HTTPCookieStorage.shared.deleteCookie(cookie)
            }
        }

        let dataStore = WKWebsiteDataStore.default()
        let allDataTypes = WKWebsiteDataStore.allWebsiteDataTypes()
        dataStore.fetchDataRecords(ofTypes: allDataTypes) { records in
            dataStore.removeData(ofTypes: allDataTypes, for: records) {
                completion()
            }
        }
    }

    private func loadWebPath(_ path: String) {
        guard let webView = extractStartWebView() else { return }
        let escapedPath = path.replacingOccurrences(of: "'", with: "\\'")
        webView.evaluateJavaScript("window.location.assign('" + escapedPath + "')", completionHandler: nil)
    }

    private func extractStartWebView() -> WKWebView? {
        guard let startVC = startWebRootViewController else { return nil }

        return findWKWebView(in: startVC)
    }

    private func findWKWebView(in controller: UIViewController?) -> WKWebView? {
        guard let controller = controller else { return nil }

        if let found = findWKWebView(in: controller.view) {
            return found
        }

        for child in controller.children {
            if let found = findWKWebView(in: child) {
                return found
            }
        }

        return nil
    }

    private func findWKWebView(in root: UIView?) -> WKWebView? {
        guard let root = root else { return nil }
        if let webView = root as? WKWebView { return webView }
        for child in root.subviews {
            if let found = findWKWebView(in: child) {
                return found
            }
        }
        return nil
    }

}

private struct ShellAccountView: View {
    @State var biometricEnabled: Bool

    let onBiometricToggle: (Bool) -> Void
    let onReLogin: () -> Void
    let onResetSession: () -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Anmeldung")
                    .font(.headline)

                Toggle(isOn: Binding(
                    get: { biometricEnabled },
                    set: { value in
                        biometricEnabled = value
                        onBiometricToggle(value)
                    }
                )) {
                    Text("App mit Face ID/Code entsperren")
                        .font(.body)
                }

                Button(action: onReLogin) {
                    Text("Neu anmelden")
                        .font(.body.weight(.semibold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }

                Button(action: onResetSession) {
                    Text("Session zurücksetzen und Login öffnen")
                        .font(.body.weight(.semibold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(Color(UIColor.systemGray5))
                        .foregroundColor(.primary)
                        .cornerRadius(10)
                }

                Text("Hinweis: Die Session bleibt im WebView persistent. Bei abgelaufener Session können Sie hier direkt erneut einloggen.")
                    .font(.footnote)
                    .foregroundColor(.secondary)
            }
            .padding(16)
        }
        .background(Color(UIColor.systemGroupedBackground))
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

private struct ResumeChatRequest: Codable {
    let mode: String
    let resumeContext: [String: String]
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

    func fetchDynamicStartQuestion(completion: @escaping (Result<String, Error>) -> Void) {
        var request = URLRequest(url: config.baseURL.appendingPathComponent("/api/amy/chat"))
        request.httpMethod = "POST"
        request.httpShouldHandleCookies = true
        applyCommonHeaders(to: &request)

        let resumeContext = [
            "platform": "ios_native_shell",
            "entry": "native_chat_tab",
            "timestamp": ISO8601DateFormatter().string(from: Date()),
        ]

        do {
            request.httpBody = try encoder.encode(
                ResumeChatRequest(mode: "resume", resumeContext: resumeContext)
            )
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
                    completion(.failure(NativeChatError.apiFailure(response.error?.message ?? "Start question loading failed")))
                    return
                }
                completion(.success(payload.reply))
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

        apiClient.fetchDynamicStartQuestion { [weak self] result in
            guard let self = self else { return }
            DispatchQueue.main.async {
                self.isBootstrapped = true
                self.isLoading = false
                switch result {
                case .success(let openingQuestion):
                    self.messages = [
                        ChatMessage(
                            id: "assistant-start-\(Date().timeIntervalSince1970)",
                            role: .assistant,
                            text: openingQuestion,
                            createdAt: Date()
                        ),
                    ]
                case .failure(let error):
                    self.messages = [
                        ChatMessage(
                            id: "assistant-fallback-\(Date().timeIntervalSince1970)",
                            role: .assistant,
                            text: "Hallo, ich bin PAT. Wie geht es Ihnen heute?",
                            createdAt: Date()
                        ),
                    ]
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

    private func dismissKeyboard() {
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
    }

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
                .onTapGesture {
                    dismissKeyboard()
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
                TextField("Nachricht schreiben...", text: $viewModel.inputText, onCommit: {
                    viewModel.sendMessage()
                    dismissKeyboard()
                })
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .background(Color(UIColor.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 10))

                Button {
                    dismissKeyboard()
                } label: {
                    Image(systemName: "keyboard.chevron.compact.down")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.secondary)
                        .frame(width: 32, height: 40)
                        .background(Color(UIColor.secondarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }

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
