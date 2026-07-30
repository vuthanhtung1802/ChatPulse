import { User, Conversation } from "../types/types";
import { authService } from "../services/auth.service";
import { chatService } from "../services/chat.service";
import { transformConversation, transformUser } from "../utils/transformers";

export function useAuthActions(
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>,
  chatCtx: {
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
    setActiveConversationId: React.Dispatch<React.SetStateAction<string>>;
    clearChat: () => void;
  },
) {
  const login = async (email: string, password: string) => {
    try {
      const data = await authService.login(email, password);
      sessionStorage.setItem('chatpulse_accessToken', data.accessToken);
      sessionStorage.setItem('chatpulse_refreshToken', data.refreshToken);

      const userRes = await authService.getCurrentUser();
      const user = transformUser(userRes);
      setCurrentUser(user);

      const convsRes = await chatService.getConversations();
      const convs = convsRes.map((c: any) => transformConversation(c, user.id));
      chatCtx.setConversations(convs);

      if (convs.length > 0) {
        chatCtx.setActiveConversationId(convs[0].id);
      }
      return true;
    } catch (err) {
      console.error('Login failed', err);
      return false;
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      await authService.register(name, email, password);
      return await login(email, password);
    } catch (err) {
      console.error('Signup failed', err);
      return false;
    }
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    chatCtx.clearChat();
  };

  return { login, signup, logout };
}
