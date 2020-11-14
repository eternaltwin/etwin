# typed: strict
# frozen_string_literal: true

module Etwin
  module Client
    # HTTP Etwin client interface
    class HttpEtwinClient
      extend T::Helpers
      extend T::Sig

      include EtwinClient

      final!

      sig(:final) { params(base_uri: URI::HTTP).void }
      def initialize(base_uri)
        # @type [URI::HTTP]
        @base_uri = T.let(base_uri.freeze, URI::HTTP)
        # @type [Faraday::Connection]
        @client = T.let(Faraday::Connection.new.freeze, Faraday::Connection)
        freeze
      end

      sig(:final) { override.params(auth: Auth, user_id: Etwin::User::UserId).returns(Etwin::User::User) }
      def get_user(auth, user_id)
        uri = resolve(['users', user_id.to_s])
        # @type [Faraday::Request] req
        # @type [Faraday::Response] res
        res = @client.get uri do |req|
          req.headers['Authorization'] = auth.authorization_header
        end
        Etwin::User::User.from_json res.body
      end

      private

      sig(:final) { params(segments: T::Array[String]).returns(URI::HTTP) }
      def resolve(segments)
        @base_uri.merge("api/v1/#{ segments * '/'}")
      end
    end
  end
end
